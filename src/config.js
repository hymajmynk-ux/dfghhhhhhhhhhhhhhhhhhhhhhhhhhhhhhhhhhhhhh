export const APP_CONFIG = {
  appName: 'Personal Exam Wallet',
  mode: 'DEMO',
  currency: 'EGP',
  language: 'ar',
  defaultAccount: { fullName: 'مستخدم تجريبي', phoneNumber: '01500000000' },
  wallet: { initialBalance: 5000, allowNegativeBalance: false },
  appearance: { primaryColor: '#F58220', secondaryColor: '#FFFFFF', darkMode: false },
  features: { transferSimulation: true, receiveSimulation: true, rechargeSimulation: true, billPaymentSimulation: true, transactionEditing: true },
  developerSettings: { allowReset: true, showDemoWatermark: true },
  demoTransactions: [
    { id:'DEMO-250001', type:'transfer', title:'تحويل تجريبي', counterparty:'مستلم تجريبي', phone:'01000000001', amount:650.5, direction:'out', date:'2026-11-16', time:'10:16:15', description:'عملية تحويل أموال تجريبية', status:'ناجحة' },
    { id:'DEMO-250002', type:'receive', title:'استلام تجريبي', counterparty:'مرسل تجريبي', phone:'01000000002', amount:950, direction:'in', date:'2026-11-15', time:'21:17:00', description:'عملية استلام أموال تجريبية', status:'ناجحة' },
    { id:'DEMO-250003', type:'recharge', title:'شحن رصيد تجريبي', counterparty:'رقم تجريبي', phone:'01000000003', amount:50, direction:'out', date:'2026-11-14', time:'14:05:22', description:'شحن رصيد محاكاة', status:'ناجحة' },
    { id:'DEMO-250004', type:'deposit', title:'إيداع تجريبي', counterparty:'مصدر تجريبي', phone:'01000000004', amount:1200, direction:'in', date:'2026-11-13', time:'12:30:00', description:'إيداع افتراضي للمحفظة', status:'ناجحة' },
    { id:'DEMO-250005', type:'bill', title:'دفع فاتورة تجريبية', counterparty:'خدمة افتراضية', phone:'', amount:120, direction:'out', date:'2026-11-12', time:'18:15:00', description:'دفع فاتورة محاكاة', status:'ناجحة' }
  ],
  notifications: []
}