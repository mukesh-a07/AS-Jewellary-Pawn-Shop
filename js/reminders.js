/**
 * AS JEWELLAR PAWN SHOP - AUTOMATED REMINDER ENGINE & WHATSAPP GENERATOR
 * Dynamically computes upcoming loan maturities, overdue items, and missing KYC reminders.
 */

class ReminderManager {
  constructor() {
    this.storageKeyReminders = 'as_jewellar_reminders_store';
    this.reminders = this.loadReminders();
  }

  loadReminders() {
    try {
      const stored = localStorage.getItem(this.storageKeyReminders);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load reminders from storage', e);
    }
    return this.refreshReminders();
  }

  saveReminders(list) {
    this.reminders = list;
    try {
      localStorage.setItem(this.storageKeyReminders, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save reminders', e);
    }
  }

  /**
   * Scan pledges and customers to generate active reminders
   */
  refreshReminders() {
    const pledges = (window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const customers = (window.customerManager && window.customerManager.customers) || [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);

    const generated = [];

    pledges.forEach(p => {
      if (p.status === 'REDEEMED' || p.status === 'RENEWED' || p.status === 'CLOSED') return;

      const cust = customers.find(c => c.customerId === p.customerId);
      const maturity = new Date(p.maturityDate);

      // 1. Due Today
      if (p.maturityDate === todayStr) {
        generated.push({
          reminderId: `REM-${p.ticketNo}-TODAY`,
          ticketNo: p.ticketNo,
          customerId: p.customerId,
          customerName: cust ? cust.nameEn : p.customerId,
          customerNameTa: cust ? (cust.nameTa || '') : '',
          mobile: cust ? cust.mobile : '',
          reminderType: 'DUE_TODAY',
          category: 'MATURITY',
          dueDate: p.maturityDate,
          loanAmount: p.loanAmount,
          status: 'PENDING',
          createdAt: todayStr,
          priority: 'HIGH'
        });
      }
      // 2. Upcoming Due in 7 Days
      else if (maturity > now && maturity <= sevenDays) {
        generated.push({
          reminderId: `REM-${p.ticketNo}-7D`,
          ticketNo: p.ticketNo,
          customerId: p.customerId,
          customerName: cust ? cust.nameEn : p.customerId,
          customerNameTa: cust ? (cust.nameTa || '') : '',
          mobile: cust ? cust.mobile : '',
          reminderType: (p.maturityDate === tomorrowStr) ? 'DUE_TOMORROW' : 'UPCOMING_7D',
          category: 'MATURITY',
          dueDate: p.maturityDate,
          loanAmount: p.loanAmount,
          status: 'PENDING',
          createdAt: todayStr,
          priority: 'MEDIUM'
        });
      }
      // 3. Overdue (> 12 Months)
      else if (maturity < now) {
        generated.push({
          reminderId: `REM-${p.ticketNo}-OVERDUE`,
          ticketNo: p.ticketNo,
          customerId: p.customerId,
          customerName: cust ? cust.nameEn : p.customerId,
          customerNameTa: cust ? (cust.nameTa || '') : '',
          mobile: cust ? cust.mobile : '',
          reminderType: 'OVERDUE',
          category: 'OVERDUE',
          dueDate: p.maturityDate,
          loanAmount: p.loanAmount,
          status: 'PENDING',
          createdAt: todayStr,
          priority: 'URGENT'
        });
      }
    });

    // 4. Missing KYC Documents
    customers.forEach(c => {
      if (c.kycStatus === 'PENDING' || !c.idNumber) {
        generated.push({
          reminderId: `REM-KYC-${c.customerId}`,
          ticketNo: '-',
          customerId: c.customerId,
          customerName: c.nameEn,
          customerNameTa: c.nameTa || '',
          mobile: c.mobile,
          reminderType: 'MISSING_KYC',
          category: 'DOCUMENT',
          dueDate: todayStr,
          loanAmount: 0,
          status: 'PENDING',
          createdAt: todayStr,
          priority: 'LOW'
        });
      }
    });

    // Preserve existing completed/contacted statuses
    const existingMap = new Map(this.reminders ? this.reminders.map(r => [r.reminderId, r]) : []);
    const merged = generated.map(g => {
      const existing = existingMap.get(g.reminderId);
      if (existing) {
        return { ...g, status: existing.status, notes: existing.notes, completedAt: existing.completedAt };
      }
      return g;
    });

    this.saveReminders(merged);
    return merged;
  }

  /**
   * Get Reminders by Filter
   */
  getReminders(filter = 'ALL') {
    const list = this.refreshReminders();
    const todayStr = new Date().toISOString().split('T')[0];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (filter === 'TODAY') {
      return list.filter(r => r.dueDate === todayStr && r.category === 'MATURITY');
    }
    if (filter === 'TOMORROW') {
      return list.filter(r => r.dueDate === tomorrowStr);
    }
    if (filter === '7DAYS') {
      return list.filter(r => r.reminderType === 'UPCOMING_7D' || r.reminderType === 'DUE_TOMORROW' || r.dueDate === todayStr);
    }
    if (filter === 'OVERDUE') {
      return list.filter(r => r.reminderType === 'OVERDUE');
    }
    if (filter === 'MISSING_DOCS') {
      return list.filter(r => r.reminderType === 'MISSING_KYC');
    }
    if (filter === 'COMPLETED') {
      return list.filter(r => r.status === 'COMPLETED' || r.status === 'CONTACTED');
    }

    return list;
  }

  /**
   * Update Reminder Status (Mark Contacted / Completed)
   */
  updateStatus(reminderId, status = 'CONTACTED', notes = '') {
    const r = this.reminders.find(item => item.reminderId === reminderId);
    if (r) {
      r.status = status;
      r.notes = notes;
      r.completedAt = new Date().toISOString();
      this.saveReminders(this.reminders);
      return true;
    }
    return false;
  }

  /**
   * Build WhatsApp Pre-filled URL with Bilingual Message
   */
  generateWhatsAppUrl(reminder) {
    const cleanMobile = String(reminder.mobile || '').replace(/\D/g, '');
    const mobileWithCountry = cleanMobile.startsWith('91') ? cleanMobile : `91${cleanMobile}`;

    let intDue = '₹ 0';
    let totalDue = `₹ ${Number(reminder.loanAmount).toLocaleString('en-IN')}`;

    if (window.paymentManager && reminder.ticketNo !== '-') {
      const pledge = window.pledgePosManager.pledges.find(p => p.ticketNo === reminder.ticketNo);
      if (pledge) {
        const acc = window.paymentManager.calculateInterestAccrual(pledge);
        intDue = `₹ ${acc.netInterestDue.toLocaleString('en-IN')}`;
        totalDue = `₹ ${acc.totalAmountDue.toLocaleString('en-IN')}`;
      }
    }

    const message = `வணக்கம் திரு/திருமதி ${reminder.customerName} (${reminder.customerNameTa || ''}),\n` +
      `ஏ.எஸ் ஜூவல்லர்ஸ் (AS Jewellar Pawn Shop).\n\n` +
      `அடகு சீட்டு எண்: ${reminder.ticketNo}\n` +
      `கெடு தேதி: ${reminder.dueDate}\n` +
      `அசல் கடன்: ₹ ${Number(reminder.loanAmount).toLocaleString('en-IN')}\n` +
      `நிலுவை வட்டி: ${intDue}\n` +
      `மொத்த தொகை: ${totalDue}\n\n` +
      `நேரில் வந்து வட்டி செலுத்தி புதுப்பிக்கவும் அல்லது நகைகளை மீட்டுக்கொள்ளவும் கேட்டுக்கொள்கிறோம்.\n` +
      `தொடர்புக்கு: 0452-2345678 / 9876543210. நன்றி!`;

    const encoded = encodeURIComponent(message);
    return `https://wa.me/${mobileWithCountry}?text=${encoded}`;
  }
}

// Global ReminderManager Instance
window.reminderManager = new ReminderManager();
