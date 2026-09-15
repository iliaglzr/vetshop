import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { ROLE_LABELS } from '../utils/roles';

const roles = ['user','pet_shop','pharmacy','vaccination'];

export default function AdminProduct(){
  const { id }=useParams();
  const nav=useNavigate();
  const [cats,setCats]=useState([]);
  const [p,setP]=useState({name:'',sku:'',category_id:'',brand_id:'',price:'',old_price:'',discount_percentage:0,stock:0,minimum_order_quantity:1,minimum_stock:5,expiration_date:'',description:'',short_description:'',is_featured:false,is_active:true,allowed_roles:[]});
  useEffect(()=>{api.get('/categories').then(r=>setCats(r.data));if(id)api.get('/products/'+id).then(r=>setP({...r.data,allowed_roles:r.data.roles?.map(x=>x.role)||[]}))},[id]);
  const set=(k,v)=>setP(x=>({...x,[k]:v}));
  const toggleRole=role=>set('allowed_roles',p.allowed_roles.includes(role)?p.allowed_roles.filter(x=>x!==role):[...p.allowed_roles,role]);
  async function save(e){e.preventDefault();try{if(id)await api.put('/admin/products/'+id,p);else await api.post('/admin/products',p);nav('/admin/products')}catch(e){alert(Object.values(e.response?.data?.errors||{x:[e.response?.data?.message||'خطا']}).flat().join('\n'))}}
  return <section className="wrap section"><div className="panel form"><h2>{id?'ویرایش محصول':'افزودن محصول'}</h2><div className="form-grid">{[['name','نام محصول'],['sku','SKU'],['price','قیمت'],['old_price','قیمت قبلی'],['discount_percentage','تخفیف درصدی'],['stock','موجودی'],['minimum_order_quantity','حداقل سفارش'],['minimum_stock','حداقل موجودی'],['expiration_date','تاریخ انقضا']].map(([k,l])=><input key={k} value={p[k]??''} onChange={e=>set(k,e.target.value)} placeholder={l}/>)}<select value={p.category_id||''} onChange={e=>set('category_id',e.target.value)}><option value="">دسته‌بندی</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><textarea value={p.description||''} onChange={e=>set('description',e.target.value)} placeholder="توضیحات کامل محصول"/><textarea value={p.short_description||''} onChange={e=>set('short_description',e.target.value)} placeholder="توضیحات کوتاه"/><h3>چه Roleهایی اجازه خرید این محصول را دارند؟</h3><p className="hint">اگر هیچ Roleای انتخاب نشود، محصول برای همه کاربران واردشده قابل خرید است.</p><div className="role-checks">{roles.map(role=><label key={role}><input type="checkbox" checked={p.allowed_roles.includes(role)} onChange={()=>toggleRole(role)}/>{ROLE_LABELS[role]}</label>)}</div><label><input type="checkbox" checked={!!p.is_featured} onChange={e=>set('is_featured',e.target.checked)}/> محصول ویژه</label><label><input type="checkbox" checked={!!p.is_active} onChange={e=>set('is_active',e.target.checked)}/> فعال</label><button className="btn" onClick={save}>ذخیره محصول</button></div></section>
}
