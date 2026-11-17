import React, { useEffect, useMemo, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Home, Wallet, History, Grid3X3, UserRound, Bell, Eye, EyeOff, ArrowDownLeft, ArrowUpRight, Smartphone, ReceiptText, Plus, Search, SlidersHorizontal, ChevronLeft, CheckCircle2, X, Settings, Download, Upload, RotateCcw, LogOut, Moon, Sun, ShieldCheck, CircleHelp, Trash2, Pencil, Menu, Copy, CircleDollarSign } from 'lucide-react'
import { APP_CONFIG } from './config'
import { loadState, saveState, resetState, makeId } from './storage'

const money = n => new Intl.NumberFormat('en-EG',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n||0))
const today = () => new Date().toISOString().slice(0,10)
const timeNow = () => new Date().toLocaleTimeString('en-GB')
const typeNames = {transfer:'تحويل أموال',receive:'استلام أموال',deposit:'إيداع',withdraw:'سحب',recharge:'شحن رصيد',bill:'دفع فاتورة',service:'دفع خدمة',adjustment:'تعديل رصيد'}
const icons = {transfer:ArrowUpRight,receive:ArrowDownLeft,deposit:ArrowDownLeft,withdraw:ArrowUpRight,recharge:Smartphone,bill:ReceiptText,service:Grid3X3,adjustment:CircleDollarSign}
const initialState = loadState()

function App(){
  const [state,setState] = useState(initialState)
  const [tab,setTab] = useState('home')
  const [screen,setScreen] = useState('welcome')
  const [selected,setSelected] = useState(null)
  const [toast,setToast] = useState('')
  const [formType,setFormType] = useState('transfer')
  const [query,setQuery] = useState('')
  const [filter,setFilter] = useState('all')
  const [sort,setSort] = useState('new')
  const [modal,setModal] = useState('')
  const [editing,setEditing] = useState(null)
  const [showPass,setShowPass] = useState(false)
  const [form,setForm] = useState({name:'',phone:'',password:'',confirm:''})
  const [txForm,setTxForm] = useState({name:'',phone:'',amount:'',description:''})
  const [dark,setDark] = useState(state.preferences?.dark||false)
  const account = state.accounts.find(a=>a.id===state.currentId)
  useEffect(()=>saveState(state),[state])
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(''),2600);return()=>clearTimeout(t)}},[toast])
  const update = patch => setState(s=>({...s,...patch}))
  const notify = (title,description) => update({notifications:[{id:makeId('NOTICE'),title,description,date:new Date().toLocaleString('ar-EG'),read:false},...(state.notifications||[])]})
  const balance = state.balance ?? APP_CONFIG.wallet.initialBalance
  const txs = state.transactions || []
  const go = t => {setTab(t);setScreen('app');setSelected(null)}
  const logout = () => {update({currentId:null});setScreen('welcome');setTab('home')}
  const register = e => {
    e.preventDefault()
    if(!form.name.trim()||!/^01[0-9]{9}$/.test(form.phone)||form.password.length<4||form.password!==form.confirm){setToast('راجع البيانات: الاسم والرقم وكلمة المرور مطلوبة');return}
    if(state.accounts.some(a=>a.phone===form.phone)){setToast('هذا الحساب التجريبي مسجل بالفعل');return}
    const id=makeId('ACCOUNT'), account={id,name:form.name.trim(),phone:form.phone,passwordHash:btoa(form.password),created:new Date().toLocaleDateString('ar-EG')}
    update({accounts:[...state.accounts,account],currentId:id,balance:APP_CONFIG.wallet.initialBalance})
    setScreen('app');setToast('تم إنشاء الحساب التجريبي')
  }
  const login = e => {
    e.preventDefault()
    const a=state.accounts.find(x=>x.phone===form.phone&&x.passwordHash===btoa(form.password))
    if(!a){setToast('بيانات الدخول غير صحيحة أو الحساب غير موجود');return}
    update({currentId:a.id});setScreen('app');setToast('تم تسجيل الدخول التجريبي')
  }
  const addTx = (data,editId=null) => {
    const amount=Number(data.amount)
    if(!Number.isFinite(amount)||amount<=0){setToast('أدخل مبلغاً صحيحاً أكبر من صفر');return}
    const old=editId?txs.find(t=>t.id===editId):null
    const direction=data.direction || (formType==='receive'?'in':'out')
    const delta=(direction==='in'?amount:-amount) - (old?(old.direction==='in'?old.amount:-old.amount):0)
    if(!APP_CONFIG.wallet.allowNegativeBalance && balance+delta<0){setToast('الرصيد الافتراضي غير كافٍ');return}
    const item={id:editId||makeId('DEMO'),type:data.type||formType,title:data.title||typeNames[data.type||formType]+' تجريبي',counterparty:data.name||'طرف تجريبي',phone:data.phone||'',amount,direction,date:data.date||today(),time:data.time||timeNow(),description:data.description||'عملية محاكاة تعليمية',status:'ناجحة · DEMO'}
    const next=editId?txs.map(t=>t.id===editId?item:t):[item,...txs]
    update({transactions:next,balance:balance+delta})
    notify('عملية تجريبية جديدة',item.title+' — '+money(amount)+' جنيه')
    setModal('');setEditing(null);setTxForm({name:'',phone:'',amount:'',description:''});setToast('تم تحديث بيانات المحاكاة')
  }
  const removeTx = id => {
    const t=txs.find(x=>x.id===id);if(!t)return
    update({transactions:txs.filter(x=>x.id!==id),balance:balance-(t.direction==='in'?t.amount:-t.amount)})
    setSelected(null);setToast('تم حذف المعاملة التجريبية')
  }
  const filtered=useMemo(()=>txs.filter(t=>(filter==='all'||t.type===filter)&&[t.title,t.counterparty,t.phone,t.id].join(' ').toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==='new'?(b.date+b.time).localeCompare(a.date+a.time):sort==='old'?(a.date+a.time).localeCompare(b.date+b.time):sort==='high'?b.amount-a.amount:a.amount-b.amount),[txs,filter,query,sort])
  const exportData=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='personal-exam-wallet-demo.json';a.click();URL.revokeObjectURL(a.href)}
  const importData=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!Array.isArray(x.transactions)||typeof x.balance!=='number')throw Error();update(x);setToast('تم استيراد بيانات المحاكاة')}catch{setToast('ملف JSON غير صالح')} };r.readAsText(f)}
  const reset=()=>{if(confirm('إعادة جميع بيانات المحاكاة إلى الوضع الافتراضي؟')){setState(resetState());setScreen('welcome');setSelected(null);setToast('تمت إعادة ضبط المحاكاة')}}
  const openService=type=>{setFormType(type);setTxForm({name:'',phone:'',amount:'',description:''});setModal('service')}
  const detail=t=>{setSelected(t);setScreen('detail')}
  const tabs=[['home','الرئيسية',Home],['wallet','المحفظة',Wallet],['transactions','المعاملات',History],['services','الخدمات',Grid3X3],['account','حسابي',UserRound]]
  return <div className={dark?'shell dark':'shell'}>
    <div className="demo-banner"><ShieldCheck size={14}/> PERSONAL EXAM WALLET · DEMO SIMULATION · لا توجد أموال حقيقية</div>
    {screen==='welcome'&&<Welcome setScreen={setScreen} setForm={setForm} />}
    {screen==='register'&&<Auth title="إنشاء حساب تجريبي" submit={register} form={form} setForm={setForm} showPass={showPass} setShowPass={setShowPass} submitText="إنشاء الحساب"/>}
    {screen==='login'&&<Auth title="تسجيل الدخول التجريبي" submit={login} form={form} setForm={setForm} showPass={showPass} setShowPass={setShowPass} submitText="دخول"/>}
    {screen==='app'&&<><header className="app-header"><div><small>أهلاً بك</small><h2>{account?.name||'زائر تجريبي'}</h2></div><button className="icon-btn" onClick={()=>setModal('notifications')} aria-label="الإشعارات"><Bell/><i>{state.notifications?.filter(n=>!n.read).length||0}</i></button></header>
      <main className="content">
        {tab==='home'&&<><Balance balance={balance} hidden={state.preferences?.hideBalance} toggle={()=>update({preferences:{...state.preferences,hideBalance:!state.preferences?.hideBalance}})} phone={account?.phone}/><QuickActions open={openService}/><Section title="آخر المعاملات" action={()=>go('transactions')}/><TxList items={txs.slice(0,5)} onOpen={detail}/><div className="notice-box">كل الأرصدة والمعاملات في هذا التطبيق افتراضية ومحفوظة محلياً على هذا المتصفح.</div></>}
        {tab==='wallet'&&<><Section title="ملخص المحفظة"/><Balance balance={balance} hidden={state.preferences?.hideBalance} toggle={()=>update({preferences:{...state.preferences,hideBalance:!state.preferences?.hideBalance}})} phone={account?.phone}/><div className="stats"><Stat label="إجمالي الوارد" value={money(txs.filter(t=>t.direction==='in').reduce((a,t)=>a+t.amount,0))}/><Stat label="إجمالي الصادر" value={money(txs.filter(t=>t.direction==='out').reduce((a,t)=>a+t.amount,0))}/><Stat label="عدد المعاملات" value={txs.length}/><Stat label="معرّف المحفظة" value="DEMO-WALLET"/></div><div className="notice-box">محفظة تعليمية متعددة الحسابات. بيانات الحساب ليست محمية بخادم أو قاعدة بيانات آمنة.</div></>}
        {tab==='transactions'&&<><Section title="سجل المعاملات"/><div className="searchbar"><Search/><input placeholder="ابحث بالاسم أو الرقم أو المرجع" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="filters"><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">كل الأنواع</option>{Object.entries(typeNames).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select><select value={sort} onChange={e=>setSort(e.target.value)}><option value="new">الأحدث أولاً</option><option value="old">الأقدم أولاً</option><option value="high">الأعلى مبلغاً</option><option value="low">الأقل مبلغاً</option></select></div><TxList items={filtered} onOpen={detail}/></>}
        {tab==='services'&&<><Section title="الخدمات التجريبية"/><div className="service-grid"><Service icon={ArrowUpRight} title="تحويل أموال" click={()=>openService('transfer')}/><Service icon={ArrowDownLeft} title="استلام أموال" click={()=>openService('receive')}/><Service icon={Smartphone} title="شحن رصيد" click={()=>openService('recharge')}/><Service icon={ReceiptText} title="دفع فاتورة" click={()=>openService('bill')}/><Service icon={CircleDollarSign} title="إيداع تجريبي" click={()=>openService('deposit')}/><Service icon={CircleDollarSign} title="سحب تجريبي" click={()=>openService('withdraw')}/></div><div className="notice-box">هذه الخدمات تنشئ سجلات محلية فقط، ولا تتصل بأي مزود خدمة.</div></>}
        {tab==='account'&&<><Section title="حسابي"/><div className="profile-card"><div className="profile-avatar">{(account?.name||'م').slice(0,1)}</div><h2>{account?.name||'مستخدم تجريبي'}</h2><p>{account?.phone||'—'}</p><span className="pill">حساب تجريبي</span></div><div className="settings-list"><Setting icon={Moon} label="الوضع الداكن" right={<input type="checkbox" checked={dark} onChange={e=>{setDark(e.target.checked);update({preferences:{...state.preferences,dark:e.target.checked}})}}/>}/><Setting icon={Bell} label="مركز الإشعارات" click={()=>setModal('notifications')}/><Setting icon={Settings} label="وضع المطور" click={()=>setModal('developer')}/><Setting icon={Download} label="تصدير بيانات JSON" click={exportData}/><Setting icon={Upload} label="استيراد بيانات JSON" right={<input type="file" accept=".json,application/json" onChange={importData}/>}/><Setting icon={RotateCcw} label="إعادة ضبط بيانات التجربة" click={reset}/><Setting icon={LogOut} label="تسجيل الخروج" click={logout}/></div></>}
      </main>
      <nav className="bottom-nav">{tabs.map(([id,label,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>go(id)}><Icon size={21}/><span>{label}</span></button>)}</nav>
    </>}
    {screen==='detail'&&selected&&<main className="detail-page"><button className="back-btn" onClick={()=>setScreen('app')}>→ العودة</button><div className="receipt-demo"><div className="watermark">DEMO · SIMULATION</div><div className="success-circle"><CheckCircle2 size={56}/></div><h1>{money(selected.amount)} <small>جنيه</small></h1><p>{selected.title} — تمت المحاكاة بنجاح</p><div className="receipt-card"><InfoRow label="الطرف المقابل" value={selected.counterparty}/><InfoRow label="رقم تجريبي" value={selected.phone||'غير متاح'}/></div><div className="receipt-card"><InfoRow label="حالة العملية" value="ناجحة · DEMO"/><InfoRow label="نوع العملية" value={typeNames[selected.type]||selected.type}/><InfoRow label="التاريخ" value={selected.date}/><InfoRow label="الوقت" value={selected.time}/><InfoRow label="الرقم المرجعي التجريبي" value={selected.id}/><InfoRow label="الوصف" value={selected.description}/></div><div className="warning-stamp">نموذج تجريبي — ليس إيصالاً مالياً أو إثبات دفع</div><div className="detail-actions"><button className="secondary" onClick={()=>{setEditing(selected);setTxForm({name:selected.counterparty,phone:selected.phone,amount:String(selected.amount),description:selected.description});setFormType(selected.type);setModal('edit')}}><Pencil size={16}/> تعديل</button><button className="danger" onClick={()=>removeTx(selected.id)}><Trash2 size={16}/> حذف</button></div></div></main>}
    {modal==='service'&&<Modal title={typeNames[formType]+' · محاكاة'} close={()=>setModal('')}><form onSubmit={e=>{e.preventDefault();addTx({type:formType,name:txForm.name,phone:txForm.phone,amount:txForm.amount,description:txForm.description,direction:['receive','deposit'].includes(formType)?'in':'out'})}}><label>{formType==='receive'?'اسم المرسل':'اسم الطرف المقابل'}</label><input value={txForm.name} onChange={e=>setTxForm({...txForm,name:e.target.value})} placeholder="اسم تجريبي"/><label>رقم هاتف تجريبي</label><input value={txForm.phone} onChange={e=>setTxForm({...txForm,phone:e.target.value})} placeholder="01xxxxxxxxx" inputMode="numeric"/><label>المبلغ بالجنيه</label><input required type="number" min="0.01" step="0.01" value={txForm.amount} onChange={e=>setTxForm({...txForm,amount:e.target.value})} placeholder="0.00"/><label>الوصف</label><input value={txForm.description} onChange={e=>setTxForm({...txForm,description:e.target.value})} placeholder="وصف اختياري"/><div className="modal-note">سيتم إنشاء سجل محاكاة محلي فقط، دون تنفيذ أي دفع أو تحويل.</div><button className="primary full">تأكيد المحاكاة</button></form></Modal>}
    {modal==='edit'&&<Modal title="تعديل معاملة تجريبية" close={()=>{setModal('');setEditing(null)}}><form onSubmit={e=>{e.preventDefault();addTx({type:editing.type,name:txForm.name,phone:txForm.phone,amount:txForm.amount,description:txForm.description,direction:editing.direction,date:editing.date,time:editing.time},editing.id)}}><label>اسم الطرف</label><input value={txForm.name} onChange={e=>setTxForm({...txForm,name:e.target.value})}/><label>رقم تجريبي</label><input value={txForm.phone} onChange={e=>setTxForm({...txForm,phone:e.target.value})}/><label>المبلغ</label><input type="number" min="0.01" step="0.01" value={txForm.amount} onChange={e=>setTxForm({...txForm,amount:e.target.value})}/><label>الوصف</label><input value={txForm.description} onChange={e=>setTxForm({...txForm,description:e.target.value})}/><button className="primary full">حفظ التعديلات</button></form></Modal>}
    {modal==='notifications'&&<Modal title="مركز الإشعارات" close={()=>setModal('')}><div className="modal-tools"><button className="secondary" onClick={()=>update({notifications:state.notifications.map(n=>({...n,read:true}))})}>تحديد الكل كمقروء</button><button className="secondary" onClick={()=>update({notifications:[]})}>مسح الكل</button></div>{state.notifications.length?state.notifications.map(n=><div className="notification" key={n.id} onClick={()=>update({notifications:state.notifications.map(x=>x.id===n.id?{...x,read:true}:x)})}><b>{n.title}</b><p>{n.description}</p><small>{n.date}</small></div>):<Empty text="لا توجد إشعارات حالياً"/>}</Modal>}
    {modal==='developer'&&<Modal title="DEMO DEVELOPER MODE" close={()=>setModal('')}><div className="dev-grid"><Stat label="الحساب الحالي" value={account?.phone||'لا يوجد'}/><Stat label="الرصيد الافتراضي" value={money(balance)+' EGP'}/><Stat label="عدد المعاملات" value={txs.length}/><Stat label="إصدار التطبيق" value="1.0.0"/></div><button className="secondary full" onClick={exportData}><Download size={16}/> تصدير بيانات JSON</button><button className="danger full" onClick={reset}><RotateCcw size={16}/> إعادة ضبط المحاكاة</button><p className="modal-note">كل البيانات محلية ويمكن تعديلها من هذا المتصفح فقط. هذا الوضع ليس نظاماً آمناً.</p></Modal>}
    {toast&&<div className="toast">{toast}</div>}
  </div>
}

function Welcome({setScreen,setForm}){return <div className="welcome"><div className="welcome-logo"><Wallet size={42}/></div><div className="eyebrow">EDUCATIONAL FINTECH SIMULATOR</div><h1>Personal Exam Wallet</h1><p>محفظة إلكترونية تعليمية تفاعلية — جرّب الخدمات وإدارة المعاملات ببيانات افتراضية.</p><div className="welcome-card"><div className="demo-pill">DEMO ONLY</div><h3>ابدأ تجربتك</h3><button className="primary full" onClick={()=>{setForm({name:'',phone:'',password:'',confirm:''});setScreen('register')}}>إنشاء حساب تجريبي</button><button className="secondary full" onClick={()=>{setForm({name:'',phone:'',password:'',confirm:''});setScreen('login')}}>تسجيل الدخول</button><small>لا يتم الاتصال بأي مؤسسة مالية أو خدمة دفع.</small></div></div>}
function Auth({title,submit,form,setForm,showPass,setShowPass,submitText}){return <div className="auth-wrap"><button className="back-btn" onClick={()=>location.hash=''}>Personal Exam Wallet</button><form className="auth-card" onSubmit={submit}><div className="welcome-logo small-logo"><Wallet/></div><h2>{title}</h2>{title.includes('إنشاء')&&<><label>الاسم بالكامل</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="اسم تجريبي"/><label>تأكيد كلمة المرور</label><input required type={showPass?'text':'password'} value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} /></>}<label>رقم الهاتف التجريبي</label><input required inputMode="numeric" maxLength="11" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="01xxxxxxxxx"/><label>كلمة المرور</label><div className="password"><input required type={showPass?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><button type="button" onClick={()=>setShowPass(!showPass)}>{showPass?<EyeOff/>:<Eye/>}</button></div><button className="primary full">{submitText}</button><small>تنبيه: بيانات الحساب تجريبية ومحفوظة محلياً. لا تستخدم كلمة مرور حقيقية.</small></form></div>}
function Balance({balance,hidden,toggle,phone}){return <section className="balance-card"><div className="balance-top"><span>الرصيد المتاح · DEMO</span><button onClick={toggle} aria-label="إظهار أو إخفاء الرصيد">{hidden?<Eye/>:<EyeOff/>}</button></div><div className="balance-number">{hidden?'••••••':money(balance)} <small>EGP</small></div><div className="balance-bottom"><span>محفظة افتراضية</span><span>{phone||'DEMO ACCOUNT'}</span></div></section>}
function QuickActions({open}){return <div className="quick-grid"><Service icon={ArrowUpRight} title="تحويل" click={()=>open('transfer')}/><Service icon={ArrowDownLeft} title="استلام" click={()=>open('receive')}/><Service icon={Smartphone} title="شحن" click={()=>open('recharge')}/><Service icon={ReceiptText} title="فواتير" click={()=>open('bill')}/></div>}
function Service({icon:Icon,title,click}){return <button className="service-tile" onClick={click}><span><Icon/></span><b>{title}</b></button>}
function Section({title,action}){return <div className="section-title"><h3>{title}</h3>{action&&<button onClick={action}>عرض الكل <ChevronLeft size={15}/></button>}</div>}
function TxList({items,onOpen}){return <div className="tx-list">{items.length?items.map(t=>{const Icon=icons[t.type]||CircleDollarSign;return <button className="tx-item" key={t.id} onClick={()=>onOpen(t)}><span className="tx-icon"><Icon size={19}/></span><span className="tx-copy"><b>{t.title}</b><small>{t.counterparty} · {t.date}</small><em>DEMO</em></span><strong className={t.direction==='in'?'in':'out'}>{t.direction==='in'?'+':'−'}{money(t.amount)}<small>EGP</small></strong></button>}):<Empty text="لا توجد معاملات مطابقة"/>}</div>}
function Stat({label,value}){return <div className="stat"><small>{label}</small><b>{value}</b></div>}
function Setting({icon:Icon,label,click,right}){return <button className="setting-row" onClick={click}><Icon size={19}/><span>{label}</span>{right||<ChevronLeft size={17}/>}</button>}
function Modal({title,close,children}){return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="modal"><div className="modal-head"><h3>{title}</h3><button onClick={close}><X/></button></div>{children}</div></div>}
function InfoRow({label,value}){return <div className="info-row"><span>{label}</span><b>{value}</b></div>}
function Empty({text}){return <div className="empty"><CircleHelp/><p>{text}</p></div>}
export default App
