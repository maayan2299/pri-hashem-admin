import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus, Trash2, Edit3, Save, X, Package, Upload,
  Image as ImageIcon, Tag, LogOut, Eye, EyeOff,
  Star, Check, AlertCircle, Grid, BarChart2
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_USERNAME = 'priheh_admin';
const ADMIN_PASSWORD = 'priheh2025';

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 shadow-2xl text-white text-sm font-medium rounded-lg ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
      {type === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
      {message}
    </div>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div onClick={() => onChange(!value)} className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${value ? 'bg-green-600' : 'bg-gray-200'}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${value ? 'right-0.5' : 'left-0.5'}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function Label({ children }) {
  return <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400 mb-1.5">{children}</label>;
}

function Input({ className = '', ...props }) {
  return <input className={`w-full px-3 py-2.5 border border-gray-200 focus:outline-none focus:border-green-600 text-sm transition-colors bg-white rounded ${className}`} {...props} />;
}

function Textarea({ className = '', ...props }) {
  return <textarea className={`w-full px-3 py-2.5 border border-gray-200 focus:outline-none focus:border-green-600 text-sm transition-colors bg-white resize-none rounded ${className}`} {...props} />;
}

function SelEl({ children, className = '', ...props }) {
  return <select className={`w-full px-3 py-2.5 border border-gray-200 focus:outline-none focus:border-green-600 text-sm transition-colors bg-white rounded ${className}`} {...props}>{children}</select>;
}

// ─── Product Form ───
function ProductForm({ editingId, initialForm, initialImages, categories, onSave, onCancel }) {
  const [form, setForm] = useState(initialForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState(initialImages || []);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  function handleImagesChange(e) {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setUploading(true);
    try {
      const newImageUrls = [];
      for (const file of imageFiles) {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('products').upload(fileName, file, { upsert: true });
        if (upErr) throw upErr;
        newImageUrls.push(`${supabaseUrl}/storage/v1/object/public/products/${fileName}`);
      }
      const allImages = [...existingImages, ...newImageUrls];
      const image_url = allImages.length > 0 ? allImages[0] : null;
      const productData = {
        name: form.name,
        price: parseFloat(form.price) || 0,
        description: form.description,
        category_id: form.category_id || null,
        image_url,
        serves: form.serves ? parseInt(form.serves) : null,
        min_people: form.min_people ? parseInt(form.min_people) : null,
        max_people: form.max_people ? parseInt(form.max_people) : null,
        size: form.size || null,
        is_active: form.is_active,
        is_featured: form.is_featured,
        // ─── הנחה ───
        on_sale: form.on_sale,
        sale_price: form.on_sale && form.sale_price ? parseFloat(form.sale_price) : null,
      };
      if (editingId) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(productData);
        if (error) throw error;
      }
      onSave(editingId ? 'עודכן ✓' : 'נוסף ✓');
    } catch (err) {
      onSave(null, 'שגיאה: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 p-6 mb-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-base">{editingId ? 'עריכת מוצר' : 'מוצר חדש'}</h3>
        <button onClick={onCancel} className="text-gray-300 hover:text-black"><X size={20} /></button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label>שם המוצר *</Label>
            <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="לדוגמה: מגש פירות מלבני S" />
          </div>
          <div>
            <Label>קטגוריה</Label>
            <SelEl value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
              <option value="">ללא קטגוריה</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelEl>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>מחיר (₪) *</Label>
            <Input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
          </div>
          <div>
            <Label>גודל / מידה</Label>
            <Input value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} placeholder='לדוגמה: XL, 45 ס"מ' />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <Label>כמה סועדים (כללי)</Label>
            <Input type="number" min="0" value={form.serves} onChange={e => setForm({ ...form, serves: e.target.value })} placeholder="8" />
          </div>
          <div>
            <Label>מינ׳ סועדים</Label>
            <Input type="number" min="0" value={form.min_people} onChange={e => setForm({ ...form, min_people: e.target.value })} placeholder="5" />
          </div>
          <div>
            <Label>מקס׳ סועדים</Label>
            <Input type="number" min="0" value={form.max_people} onChange={e => setForm({ ...form, max_people: e.target.value })} placeholder="10" />
          </div>
        </div>
        <div className="mb-4">
          <Label>תיאור המוצר</Label>
          <Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="תיאור קצר..." />
        </div>
        <div className="flex flex-wrap gap-6 py-4 border-y border-gray-100 mb-5">
          <Toggle value={form.is_active} onChange={v => setForm({ ...form, is_active: v })} label="מוצר פעיל באתר" />
          <Toggle value={form.is_featured} onChange={v => setForm({ ...form, is_featured: v })} label="⭐ מוצר מומלץ" />
        </div>

        {/* ─── בלוק הנחה ─── */}
        <div className="mb-5 p-4 bg-orange-50 border border-orange-100 rounded-lg">
          <Toggle
            value={form.on_sale}
            onChange={v => setForm({ ...form, on_sale: v, sale_price: v ? form.sale_price : '' })}
            label="🏷️ יש הנחה על המוצר"
          />
          {form.on_sale && (
            <div className="mt-4">
              <Label>מחיר מבצע (₪)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.sale_price}
                onChange={e => setForm({ ...form, sale_price: e.target.value })}
                placeholder="לדוגמה: 299"
              />
              {form.price && form.sale_price && parseFloat(form.sale_price) < parseFloat(form.price) && (
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-sm text-gray-400 line-through">₪{parseFloat(form.price).toLocaleString('he-IL')}</span>
                  <span className="text-sm font-bold text-red-600">₪{parseFloat(form.sale_price).toLocaleString('he-IL')}</span>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                    חיסכון: ₪{(parseFloat(form.price) - parseFloat(form.sale_price)).toFixed(0)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-6">
          <Label>תמונת המוצר</Label>
          {existingImages.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {existingImages.map((url, i) => (
                <div key={i} className="relative group w-24 h-24">
                  <img src={url} className="w-full h-full object-cover border-2 border-gray-200 rounded" alt="" />
                  <button type="button" onClick={() => setExistingImages(p => p.filter((_, j) => j !== i))}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                    <X size={12} />
                  </button>
                  {i === 0 && <span className="absolute bottom-0 inset-x-0 text-center text-[9px] bg-green-600 text-white py-1 rounded-b">תמונה ראשית</span>}
                </div>
              ))}
            </div>
          )}
          {imagePreviews.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {imagePreviews.map((url, i) => (
                <div key={i} className="relative group w-24 h-24">
                  <img src={url} className="w-full h-full object-cover border-2 border-green-200 rounded" alt="" />
                  <button type="button" onClick={() => { setImageFiles(p => p.filter((_, j) => j !== i)); setImagePreviews(p => p.filter((_, j) => j !== i)); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-200 hover:border-green-500 transition-colors cursor-pointer p-6 text-center rounded-lg">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Upload size={24} className="text-green-500" />
              <p className="text-sm font-medium text-gray-600">לחץ להעלאת תמונה</p>
              <p className="text-xs">JPG, PNG, WEBP</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagesChange} />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-gray-200 text-sm hover:bg-gray-50 transition-colors rounded">ביטול</button>
          <button type="submit" disabled={uploading} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50 rounded">
            {uploading ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> שומר...</> : <><Save size={14} /> {editingId ? 'שמור שינויים' : 'הוסף מוצר'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Product Row ───
function ProductRow({ product, categories, onEdit, onDelete, onRefresh }) {
  const catName = categories.find(c => c.id === product.category_id)?.name || '—';
  async function quickToggle(field, value) {
    await supabase.from('products').update({ [field]: !value }).eq('id', product.id);
    onRefresh();
  }
  return (
    <div className="bg-white border border-gray-100 p-3 flex items-center gap-3 hover:border-gray-300 transition-colors rounded-lg">
      <div className="w-16 h-16 flex-shrink-0 bg-gray-50 border border-gray-100 overflow-hidden rounded">
        {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><ImageIcon size={20} /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{product.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400">{catName}</span>
          <span className="text-gray-200">·</span>
          {product.on_sale && product.sale_price ? (
            <>
              <span className="text-xs text-gray-400 line-through">₪{parseFloat(product.price || 0).toLocaleString('he-IL')}</span>
              <span className="text-xs text-red-600 font-semibold">₪{parseFloat(product.sale_price).toLocaleString('he-IL')}</span>
              <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">🏷️ מבצע</span>
            </>
          ) : (
            <span className="text-xs text-green-600 font-semibold">₪{parseFloat(product.price || 0).toLocaleString('he-IL')}</span>
          )}
          {(product.min_people || product.serves) && (<><span className="text-gray-200">·</span><span className="text-xs text-gray-500">{product.min_people && product.max_people ? `${product.min_people}–${product.max_people} סועדים` : product.serves ? `${product.serves} סועדים` : ''}</span></>)}
          {product.size && (<><span className="text-gray-200">·</span><span className="text-xs text-gray-400">{product.size}</span></>)}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className={`text-[10px] px-2 py-1 rounded ${product.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{product.is_active ? 'פעיל' : 'מוסתר'}</span>
        <button onClick={() => quickToggle('is_featured', product.is_featured)} className={`p-1.5 transition-colors rounded ${product.is_featured ? 'text-yellow-500' : 'text-gray-200 hover:text-yellow-500'}`}><Star size={15} fill={product.is_featured ? 'currentColor' : 'none'} /></button>
        <button onClick={() => quickToggle('is_active', product.is_active)} className="p-1.5 text-gray-300 hover:text-green-600 transition-colors rounded">{product.is_active ? <Eye size={14} /> : <EyeOff size={14} />}</button>
        <button onClick={() => onEdit(product)} className="p-1.5 text-gray-300 hover:text-blue-600 transition-colors rounded"><Edit3 size={14} /></button>
        <button onClick={() => onDelete(product.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

// ─── Login ───
function LoginScreen({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.username === ADMIN_USERNAME && form.password === ADMIN_PASSWORD) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email: 'admin@priheh.com', password: 'PriHeh2025!Secure' });
        if (error) throw error;
        localStorage.setItem('priheh_admin_auth', 'authenticated');
        onLogin();
      } catch (err) { setError('שגיאת התחברות למערכת'); }
    } else { setError('שם משתמש או סיסמה שגויים'); }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-5" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🍓</div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">פְּרִי - ה׳</h1>
          <p className="text-sm text-gray-500">מערכת ניהול</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>שם משתמש</Label><Input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
            <div className="relative">
              <Label>סיסמה</Label>
              <Input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 bottom-2.5 text-gray-300 hover:text-green-600 transition-colors">{showPass ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
            {error && <p className="text-red-500 text-xs text-center flex items-center justify-center gap-1.5"><AlertCircle size={13} /> {error}</p>}
            <button className="w-full py-3 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors duration-300">כניסה</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ───
function OverviewTab() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*'),
      supabase.from('categories').select('*').order('display_order'),
    ]).then(([{ data: prods }, { data: cats }]) => {
      setProducts(prods || []);
      setCategories(cats || []);
      setLoading(false);
    });
  }, []);
  if (loading) return <div className="text-center py-20 text-gray-300 text-sm">טוען...</div>;
  const stats = [
    { label: 'סה"כ מוצרים', value: products.length, color: 'text-green-600', bg: 'bg-green-50', icon: '📦' },
    { label: 'מוצרים פעילים', value: products.filter(p => p.is_active).length, color: 'text-blue-600', bg: 'bg-blue-50', icon: '✅' },
    { label: 'מוצרים מוסתרים', value: products.filter(p => !p.is_active).length, color: 'text-red-500', bg: 'bg-red-50', icon: '🚫' },
    { label: 'מומלצים', value: products.filter(p => p.is_featured).length, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⭐' },
    { label: 'קטגוריות', value: categories.length, color: 'text-purple-600', bg: 'bg-purple-50', icon: '🗂️' },
  ];
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h2 className="font-bold text-base mb-4">מוצרים לפי קטגוריה</h2>
        <div className="space-y-3">
          {categories.map(cat => {
            const count = products.filter(p => p.category_id === cat.id).length;
            const pct = products.length > 0 ? (count / products.length) * 100 : 0;
            return (
              <div key={cat.id} className="flex items-center gap-3">
                <span className="text-sm font-medium w-32 flex-shrink-0 truncate text-right">{cat.name}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-16 text-left">{count} מוצרים</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Products Tab ───
const EMPTY_FORM = { name: '', price: '', description: '', category_id: '', serves: '', min_people: '', max_people: '', size: '', is_active: true, is_featured: false, on_sale: false, sale_price: '' };

function ProductsTab({ showToast }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('');
  useEffect(() => { fetchAll(); }, []);
  async function fetchAll() {
    setLoading(true);
    try {
      const [{ data: prods, error: prodsErr }, { data: cats, error: catsErr }] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('display_order'),
      ]);
      if (prodsErr) showToast('שגיאה: ' + prodsErr.message, 'error');
      if (catsErr) showToast('שגיאה: ' + catsErr.message, 'error');
      setProducts(prods || []);
      setCategories(cats || []);
    } catch (err) { showToast('שגיאה: ' + err.message, 'error'); }
    finally { setLoading(false); }
  }
  function startNew() { setEditingProduct(null); setShowForm(true); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50); }
  function startEdit(product) { setEditingProduct(product); setShowForm(true); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50); }
  function handleSave(successMsg, errMsg) {
    if (errMsg) { showToast(errMsg, 'error'); return; }
    showToast(successMsg);
    setShowForm(false);
    setEditingProduct(null);
    fetchAll();
  }
  async function handleDelete(id) {
    if (!confirm('למחוק את המוצר?')) return;
    await supabase.from('products').delete().eq('id', id);
    showToast('נמחק');
    fetchAll();
  }
  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = !filterCat || p.category_id === filterCat;
    return matchSearch && matchCat;
  });
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[{ label: 'סה"כ מוצרים', value: products.length, color: 'text-green-600' }, { label: 'פעילים', value: products.filter(p => p.is_active).length, color: 'text-blue-600' }, { label: 'מומלצים', value: products.filter(p => p.is_featured).length, color: 'text-yellow-600' }].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 p-4 text-center rounded-lg shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <input type="text" placeholder="חיפוש מוצר..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 min-w-[160px] px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-green-600 bg-white rounded" />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-green-600 bg-white rounded min-w-[140px]">
          <option value="">כל הקטגוריות</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={startNew} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 transition-colors whitespace-nowrap rounded">
          <Plus size={15} /> מוצר חדש
        </button>
      </div>
      {showForm && (
        <ProductForm
          editingId={editingProduct?.id}
          initialForm={editingProduct ? {
            name: editingProduct.name || '', price: editingProduct.price || '',
            description: editingProduct.description || '', category_id: editingProduct.category_id || '',
            serves: editingProduct.serves ?? '', min_people: editingProduct.min_people ?? '',
            max_people: editingProduct.max_people ?? '', size: editingProduct.size ?? '',
            is_active: editingProduct.is_active ?? true, is_featured: editingProduct.is_featured ?? false,
            on_sale: editingProduct.on_sale ?? false, sale_price: editingProduct.sale_price ?? '',
          } : { ...EMPTY_FORM }}
          initialImages={editingProduct?.image_url ? [editingProduct.image_url] : []}
          categories={categories}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingProduct(null); }}
        />
      )}
      {loading ? <div className="text-center py-20 text-gray-300 text-sm">טוען...</div> : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-300"><Package size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">{searchQuery ? 'לא נמצאו תוצאות' : 'אין מוצרים עדיין'}</p></div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 mb-2">💡 לחצי על הכוכב ⭐ לסימון מומלץ | על העין 👁 להצגה/הסתרה</p>
          {filtered.map(product => <ProductRow key={product.id} product={product} categories={categories} onEdit={startEdit} onDelete={handleDelete} onRefresh={fetchAll} />)}
        </div>
      )}
    </div>
  );
}

// ─── Categories Tab — עם תמונה ───
function CategoriesTab({ showToast }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showNewCatForm, setShowNewCatForm] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editImageFile, setEditImageFile] = useState(null);
  const [newForm, setNewForm] = useState({ name: '', display_order: '' });
  const [newImageFile, setNewImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const newFileRef = useRef();
  const editFileRef = useRef();
  useEffect(() => { fetchAll(); }, []);
  async function fetchAll() {
    setLoading(true);
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').order('display_order'),
      supabase.from('products').select('id, category_id'),
    ]);
    setCategories(cats || []);
    setProducts(prods || []);
    setLoading(false);
  }
  async function uploadCategoryImage(file) {
    const ext = file.name.split('.').pop();
    const fileName = `cat-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('products').upload(fileName, file, { upsert: true });
    if (error) throw error;
    return `${supabaseUrl}/storage/v1/object/public/products/${fileName}`;
  }
  async function saveEditCat() {
    setUploading(true);
    try {
      let image_url = editForm.image_url || null;
      if (editImageFile) image_url = await uploadCategoryImage(editImageFile);
      const { error } = await supabase.from('categories').update({ name: editForm.name, display_order: parseInt(editForm.display_order) || 0, image_url }).eq('id', editingId);
      if (error) throw error;
      showToast('עודכן ✓');
      setEditingId(null);
      setEditImageFile(null);
      fetchAll();
    } catch (err) { showToast('שגיאה: ' + err.message, 'error'); }
    finally { setUploading(false); }
  }
  async function addCategory() {
    if (!newForm.name) return;
    setUploading(true);
    try {
      const slug = newForm.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u0590-\u05FF-]/g, '');
      let image_url = null;
      if (newImageFile) image_url = await uploadCategoryImage(newImageFile);
      const { error } = await supabase.from('categories').insert({ name: newForm.name, slug, display_order: parseInt(newForm.display_order) || 99, image_url });
      if (error) throw error;
      showToast('נוספה ✓');
      setShowNewCatForm(false);
      setNewForm({ name: '', display_order: '' });
      setNewImageFile(null);
      fetchAll();
    } catch (err) { showToast('שגיאה: ' + err.message, 'error'); }
    finally { setUploading(false); }
  }
  async function deleteCategory(id) {
    if (!confirm('למחוק קטגוריה זו?')) return;
    await supabase.from('categories').delete().eq('id', id);
    showToast('נמחקה');
    fetchAll();
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="text-base font-bold">ניהול קטגוריות</h2><p className="text-xs text-gray-400 mt-1">{categories.length} קטגוריות</p></div>
        <button onClick={() => setShowNewCatForm(!showNewCatForm)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 transition-colors rounded">
          <Plus size={14} /> קטגוריה חדשה
        </button>
      </div>
      {showNewCatForm && (
        <div className="bg-white border border-gray-200 p-4 mb-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><Label>שם הקטגוריה *</Label><Input value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} placeholder="לדוגמה: מגשי פירות" /></div>
            <div><Label>סדר תצוגה</Label><Input type="number" value={newForm.display_order} onChange={e => setNewForm({ ...newForm, display_order: e.target.value })} placeholder="1" /></div>
          </div>
          <div className="mb-3">
            <Label>תמונה לקטגוריה</Label>
            {newImageFile && (
              <div className="flex items-center gap-3 mb-2">
                <img src={URL.createObjectURL(newImageFile)} alt="" className="w-16 h-16 object-cover rounded border border-gray-200" />
                <button type="button" onClick={() => setNewImageFile(null)} className="text-xs text-red-500 hover:underline">הסר</button>
              </div>
            )}
            <div onClick={() => newFileRef.current?.click()} className="border-2 border-dashed border-gray-200 hover:border-green-500 transition-colors cursor-pointer p-4 text-center rounded-lg">
              <div className="flex flex-col items-center gap-1 text-gray-400"><Upload size={20} className="text-green-500" /><p className="text-xs font-medium text-gray-600">לחץ להעלאת תמונה</p></div>
              <input ref={newFileRef} type="file" accept="image/*" className="hidden" onChange={e => setNewImageFile(e.target.files[0])} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowNewCatForm(false); setNewImageFile(null); }} className="px-4 py-2 border border-gray-200 text-sm hover:bg-gray-50 rounded">ביטול</button>
            <button onClick={addCategory} disabled={uploading} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors rounded disabled:opacity-50">
              {uploading ? 'שומר...' : <><Plus size={13} /> הוסף</>}
            </button>
          </div>
        </div>
      )}
      {loading ? <div className="text-center py-20 text-gray-300 text-sm">טוען...</div> : (
        <div className="space-y-2">
          {categories.map(cat => {
            const count = products.filter(p => p.category_id === cat.id).length;
            return (
              <div key={cat.id} className="bg-white border border-gray-100 hover:border-gray-300 transition-colors rounded-lg">
                {editingId === cat.id ? (
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div><Label>שם</Label><Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                      <div><Label>סדר</Label><Input type="number" value={editForm.display_order} onChange={e => setEditForm({ ...editForm, display_order: e.target.value })} /></div>
                    </div>
                    <div className="mb-3">
                      <Label>תמונה</Label>
                      {(editForm.image_url || editImageFile) && (
                        <div className="flex items-center gap-3 mb-2">
                          <img src={editImageFile ? URL.createObjectURL(editImageFile) : editForm.image_url} alt="" className="w-16 h-16 object-cover rounded border border-gray-200" />
                          <button type="button" onClick={() => { setEditImageFile(null); setEditForm({ ...editForm, image_url: null }); }} className="text-xs text-red-500 hover:underline">הסר</button>
                        </div>
                      )}
                      <div onClick={() => editFileRef.current?.click()} className="border-2 border-dashed border-gray-200 hover:border-green-500 transition-colors cursor-pointer p-3 text-center rounded-lg">
                        <p className="text-xs text-gray-500">לחץ לשינוי תמונה</p>
                        <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={e => setEditImageFile(e.target.files[0])} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEditCat} disabled={uploading} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors rounded disabled:opacity-50">
                        <Save size={12} /> {uploading ? 'שומר...' : 'שמור'}
                      </button>
                      <button onClick={() => { setEditingId(null); setEditImageFile(null); }} className="px-3 py-2 border border-gray-200 text-xs hover:bg-gray-50 rounded">ביטול</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3">
                    {cat.image_url
                      ? <img src={cat.image_url} alt={cat.name} className="w-12 h-12 object-cover rounded flex-shrink-0 border border-gray-100" />
                      : <div className="w-12 h-12 bg-green-50 border border-green-100 flex-shrink-0 rounded flex items-center justify-center"><Tag size={16} className="text-green-600" /></div>
                    }
                    <div className="flex-1 text-right">
                      <p className="text-sm font-semibold">{cat.name}</p>
                      <p className="text-xs text-gray-400">{count} מוצרים · סדר: {cat.display_order}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingId(cat.id); setEditForm({ name: cat.name, display_order: cat.display_order || 0, image_url: cat.image_url || null }); setEditImageFile(null); }} className="p-1.5 text-gray-300 hover:text-blue-600 transition-colors rounded"><Edit3 size={14} /></button>
                      <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded"><Trash2 size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Featured Tab ───
function FeaturedTab({ showToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchAll(); }, []);
  async function fetchAll() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').eq('is_active', true).order('name');
    setProducts(data || []);
    setLoading(false);
  }
  async function toggle(product) {
    await supabase.from('products').update({ is_featured: !product.is_featured }).eq('id', product.id);
    showToast(product.is_featured ? 'הוסר מהמומלצים' : '⭐ נוסף למומלצים');
    fetchAll();
  }
  const featured = products.filter(p => p.is_featured);
  const rest = products.filter(p => !p.is_featured);
  return (
    <div>
      <div className="mb-6"><h2 className="text-base font-bold">מוצרים מומלצים</h2><p className="text-xs text-gray-400 mt-1">{featured.length} מוצרים · לחצי על מוצר לסימון/ביטול</p></div>
      {loading ? <div className="text-center py-20 text-gray-300 text-sm">טוען...</div> : (
        <>
          {featured.length > 0 && (
            <div className="mb-8">
              <p className="text-[10px] font-bold tracking-widest uppercase text-yellow-600 mb-3">⭐ מומלצים ({featured.length})</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">{featured.map(p => <FeaturedCard key={p.id} product={p} onToggle={() => toggle(p)} isFeatured />)}</div>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-gray-300 mb-3">שאר המוצרים</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">{rest.map(p => <FeaturedCard key={p.id} product={p} onToggle={() => toggle(p)} />)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FeaturedCard({ product, onToggle, isFeatured }) {
  return (
    <div onClick={onToggle} className={`relative border-2 cursor-pointer group overflow-hidden transition-all rounded-lg ${isFeatured ? 'border-yellow-400' : 'border-gray-100 hover:border-gray-200'}`}>
      <div className="aspect-square bg-gray-50">
        {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><ImageIcon size={20} /></div>}
      </div>
      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow ${isFeatured ? 'bg-yellow-400 text-white' : 'bg-white text-gray-300'}`}>
        <Star size={11} fill={isFeatured ? 'currentColor' : 'none'} />
      </div>
      <div className="p-2 bg-white border-t border-gray-50">
        <p className="text-xs font-semibold truncate">{product.name}</p>
        {product.on_sale && product.sale_price ? (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400 line-through">₪{parseFloat(product.price || 0).toLocaleString('he-IL')}</span>
            <span className="text-xs text-red-600 font-bold">₪{parseFloat(product.sale_price).toLocaleString('he-IL')}</span>
          </div>
        ) : (
          <p className="text-xs text-green-600 mt-0.5">₪{parseFloat(product.price || 0).toLocaleString('he-IL')}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───
function MainDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('products');
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });
  const tabs = [
    { id: 'overview', label: 'סקירה', icon: <BarChart2 size={15} /> },
    { id: 'products', label: 'מוצרים', icon: <Package size={15} /> },
    { id: 'featured', label: 'מומלצים', icon: <Star size={15} /> },
    { id: 'categories', label: 'קטגוריות', icon: <Grid size={15} /> },
  ];
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍓</span>
            <h1 className="font-bold text-xl text-green-600">פְּרִי - ה׳</h1>
            <div className="h-5 w-px bg-gray-200" />
            <span className="text-xs text-gray-400">מערכת ניהול</span>
          </div>
          <nav className="flex">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.id ? 'border-green-600 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                {tab.icon}<span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
          <button onClick={onLogout} className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={14} /><span className="hidden sm:inline">יציאה</span>
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'products' && <ProductsTab showToast={showToast} />}
        {activeTab === 'featured' && <FeaturedTab showToast={showToast} />}
        {activeTab === 'categories' && <CategoriesTab showToast={showToast} />}
      </main>
    </div>
  );
}

// ─── Root ───
export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
      } else if (localStorage.getItem('priheh_admin_auth') === 'authenticated') {
        supabase.auth.signInWithPassword({ email: 'admin@priheh.com', password: 'PriHeh2025!Secure' }).then(() => setIsAuthenticated(true));
      }
      setLoading(false);
    });
  }, []);
  if (loading) return <div className="min-h-screen flex items-center justify-center">טוען...</div>;
  return isAuthenticated
    ? <MainDashboard onLogout={async () => { await supabase.auth.signOut(); setIsAuthenticated(false); localStorage.removeItem('priheh_admin_auth'); }} />
    : <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
}