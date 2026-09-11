import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Minus, Trash2, Lock, ShoppingBag, X, Check, Search,
  Store, ClipboardList, Pencil, Save, AlertTriangle, Phone, MapPin, RotateCcw
} from "lucide-react";

/* ---------------------------------------------------------
   THEME — warehouse ledger / shipping-tag trade aesthetic
--------------------------------------------------------- */
const C = {
  ink: "#1B1F2B",
  inkLight: "#252B3B",
  inkFaint: "#323A4E",
  oxblood: "#7A2E2E",
  oxbloodLight: "#9B3F3F",
  brass: "#C79A3D",
  brassLight: "#D9B563",
  paper: "#EDE6D8",
  paperDark: "#DED2B8",
  paperLine: "#C9BC9C",
  olive: "#4B5A3F",
  oliveLight: "#6C7D57",
};

const FONT_DISPLAY = "'Bitter', Georgia, serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

const CATEGORIES = ["Formal", "Sports", "Sandals", "School", "Chappal", "Kids"];

const DEFAULT_PRODUCTS = [
  { id: "1", sku: "KSC-F01", name: "Classic Oxford Formal", category: "Formal", sizeMin: 6, sizeMax: 10, stockDozens: 14, pricePerDozen: 4200, moq: 2 },
  { id: "2", sku: "KSC-S02", name: "AirGrip Runner", category: "Sports", sizeMin: 6, sizeMax: 11, stockDozens: 3, pricePerDozen: 3600, moq: 3 },
  { id: "3", sku: "KSC-SD03", name: "Comfort Ladies Sandal", category: "Sandals", sizeMin: 4, sizeMax: 8, stockDozens: 9, pricePerDozen: 2800, moq: 2 },
  { id: "4", sku: "KSC-SC04", name: "Campus School Shoe", category: "School", sizeMin: 3, sizeMax: 9, stockDozens: 22, pricePerDozen: 3100, moq: 5 },
  { id: "5", sku: "KSC-C05", name: "EVA Chappal Classic", category: "Chappal", sizeMin: 5, sizeMax: 10, stockDozens: 0, pricePerDozen: 1400, moq: 4 },
  { id: "6", sku: "KSC-K06", name: "Kids Velcro Sneaker", category: "Kids", sizeMin: 3, sizeMax: 6, stockDozens: 6, pricePerDozen: 2200, moq: 2 },
  { id: "7", sku: "KSC-F07", name: "Leather Derby Formal", category: "Formal", sizeMin: 7, sizeMax: 11, stockDozens: 5, pricePerDozen: 4800, moq: 2 },
  { id: "8", sku: "KSC-SD08", name: "Strap-Back Kolhapuri", category: "Sandals", sizeMin: 5, sizeMax: 9, stockDozens: 11, pricePerDozen: 2600, moq: 3 },
];

const DEFAULT_SETTINGS = {
  phone: "9800000000",
  address: "New Road, Kathmandu, Nepal",
  since: "2009",
};

const OWNER_PIN = "2580";
const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------------------------------------------------------
   Small pieces
--------------------------------------------------------- */
function ShoeMark({ size = 22, color = C.brass }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 17.5c0-1 .6-1.7 1.5-2l3-1c.7-.2 1.2-.8 1.4-1.5l.6-2.2c.2-.8.9-1.3 1.7-1.3h2.4c.5 0 1 .2 1.3.6l3.4 3.7c.4.4.9.7 1.5.7H21c.6 0 1 .4 1 1v2c0 .6-.4 1-1 1H3c-.6 0-1-.4-1-1v-.0Z"
        stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 9.5V7c0-.6.4-1 1-1h1.2" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function StampBadge({ text, tone }) {
  const map = {
    in: { c: C.olive, bg: "rgba(75,90,63,0.12)" },
    low: { c: C.brass, bg: "rgba(199,154,61,0.15)" },
    out: { c: C.oxblood, bg: "rgba(122,46,46,0.12)" },
  };
  const s = map[tone];
  return (
    <span
      style={{
        color: s.c,
        background: s.bg,
        border: `1.5px dashed ${s.c}`,
        fontFamily: FONT_MONO,
        letterSpacing: "0.08em",
        transform: "rotate(-3deg)",
      }}
      className="inline-block text-[10px] font-bold uppercase px-2 py-1 rounded-sm"
    >
      {text}
    </span>
  );
}

function SizeTrack({ min, max }) {
  const scale = Array.from({ length: 11 }, (_, i) => i + 3); // 3..13
  return (
    <div className="flex items-center gap-1">
      {scale.map((n) => {
        const on = n >= min && n <= max;
        return (
          <span
            key={n}
            title={`Size ${n}`}
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: on ? C.oxblood : "transparent",
              border: `1.4px solid ${on ? C.oxblood : C.paperLine}`,
            }}
          />
        );
      })}
    </div>
  );
}

function TagHole() {
  return (
    <div
      style={{ width: 14, height: 14, border: `2px solid ${C.ink}`, borderRadius: "50%" }}
      className="absolute -top-2 left-5 bg-[--paper]"
    />
  );
}

/* ---------------------------------------------------------
   Product Card (client)
--------------------------------------------------------- */
function ProductCard({ p, onAdd, inEnquiry }) {
  const status = p.stockDozens === 0 ? "out" : p.stockDozens < 4 ? "low" : "in";
  const statusText = status === "out" ? "Sold Out" : status === "low" ? "Low Stock" : "In Stock";

  return (
    <div
      className="relative rounded-md p-5 pt-6 transition-transform duration-200 hover:-translate-y-1"
      style={{
        background: C.paper,
        border: `1px solid ${C.paperLine}`,
        boxShadow: "0 3px 0 rgba(27,31,43,0.15)",
      }}
    >
      <div
        style={{
          width: 16, height: 16, border: `2.5px solid ${C.ink}`, borderRadius: "50%",
          background: "#fff",
        }}
        className="absolute -top-2 left-6"
      />
      <div className="flex items-start justify-between gap-2 mb-2">
        <div style={{ fontFamily: FONT_MONO, color: C.ink }} className="text-[10px] tracking-widest opacity-60">
          {p.sku}
        </div>
        <StampBadge text={statusText} tone={status} />
      </div>

      <h3 style={{ fontFamily: FONT_DISPLAY, color: C.ink }} className="text-lg font-semibold leading-snug mb-1">
        {p.name}
      </h3>
      <div style={{ fontFamily: FONT_MONO, color: C.oxblood }} className="text-[11px] uppercase tracking-wider mb-3">
        {p.category}
      </div>

      <div className="mb-3">
        <div style={{ fontFamily: FONT_MONO }} className="text-[10px] uppercase tracking-wider mb-1 opacity-60">
          Sizes {p.sizeMin}–{p.sizeMax}
        </div>
        <SizeTrack min={p.sizeMin} max={p.sizeMax} />
      </div>

      <div className="flex items-end justify-between mt-4 pt-3" style={{ borderTop: `1px dashed ${C.paperLine}` }}>
        <div>
          <div style={{ fontFamily: FONT_MONO, color: C.ink }} className="text-xl font-bold">
            Rs {p.pricePerDozen.toLocaleString()}
          </div>
          <div style={{ fontFamily: FONT_BODY }} className="text-[11px] opacity-60">per dozen · MOQ {p.moq} dz</div>
        </div>
        <button
          disabled={status === "out"}
          onClick={() => onAdd(p)}
          style={{
            background: inEnquiry ? C.olive : status === "out" ? C.paperDark : C.ink,
            color: status === "out" ? "#8a8272" : C.paper,
            fontFamily: FONT_BODY,
          }}
          className="text-xs font-semibold px-3 py-2 rounded-sm flex items-center gap-1 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
        >
          {inEnquiry ? <Check size={14} /> : <Plus size={14} />}
          {inEnquiry ? "Added" : "Enquire"}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Client View
--------------------------------------------------------- */
function ClientView({ products, settings }) {
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const [enquiry, setEnquiry] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const filtered = products.filter(
    (p) =>
      (cat === "All" || p.category === cat) &&
      p.name.toLowerCase().includes(query.toLowerCase())
  );

  const totalDozens = products.reduce((a, p) => a + p.stockDozens, 0);

  const toggleAdd = (p) => {
    setEnquiry((prev) =>
      prev.find((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : [...prev, p]
    );
  };

  const waLink = () => {
    const lines = enquiry.map((p) => `• ${p.name} (${p.sku}) — Sizes ${p.sizeMin}-${p.sizeMax}`);
    const text = encodeURIComponent(
      `Hello Krishna Shoe Center, I'd like to enquire wholesale rates for:\n${lines.join("\n")}`
    );
    return `https://wa.me/${settings.phone}?text=${text}`;
  };

  return (
    <div>
      {/* HERO */}
      <div style={{ background: C.ink }} className="px-6 py-14 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <ShoeMark />
            <span style={{ fontFamily: FONT_MONO, color: C.brass }} className="text-xs uppercase tracking-[0.25em]">
              Wholesale Footwear Trading · Since {settings.since}
            </span>
          </div>
          <h1
            style={{ fontFamily: FONT_DISPLAY, color: C.paper, border: `2px solid ${C.brass}` }}
            className="inline-block text-4xl md:text-6xl font-extrabold px-5 py-3 leading-tight -rotate-1"
          >
            KRISHNA SHOE CENTER
          </h1>
          <p style={{ fontFamily: FONT_BODY, color: C.paper }} className="opacity-70 mt-5 max-w-xl text-sm md:text-base">
            Bulk footwear supply for retailers across Nepal — formal, sports, sandals,
            school, chappal &amp; kids' lines, sold by the dozen, size-run ready.
          </p>

          <div className="flex flex-wrap gap-6 mt-8" style={{ fontFamily: FONT_MONO, color: C.paper }}>
            {[
              ["Styles carried", products.length],
              ["Dozens in stock", totalDozens],
              ["Categories", CATEGORIES.length],
            ].map(([label, val]) => (
              <div key={label} style={{ borderLeft: `2px solid ${C.oxbloodLight}` }} className="pl-3">
                <div className="text-2xl font-bold">{val}</div>
                <div className="text-[10px] uppercase tracking-widest opacity-60">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ background: C.paperDark, borderBottom: `1px solid ${C.paperLine}` }} className="sticky top-[57px] z-20 px-6 py-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {["All", ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                style={{
                  fontFamily: FONT_MONO,
                  background: cat === c ? C.ink : "transparent",
                  color: cat === c ? C.paper : C.ink,
                  border: `1.4px solid ${C.ink}`,
                }}
                className="text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-full whitespace-nowrap transition-colors focus:outline-none focus:ring-2"
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto w-full sm:w-56">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search styles…"
              style={{ fontFamily: FONT_BODY, border: `1.4px solid ${C.paperLine}` }}
              className="w-full text-sm pl-8 pr-3 py-1.5 rounded-full bg-white focus:outline-none focus:ring-2"
            />
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {filtered.length === 0 ? (
          <div style={{ fontFamily: FONT_BODY }} className="text-center py-20 opacity-60">
            No styles match — try a different category or search term.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                onAdd={toggleAdd}
                inEnquiry={!!enquiry.find((x) => x.id === p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ background: C.ink, color: C.paper }} className="px-6 py-8 text-sm">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3 sm:justify-between opacity-80">
          <div className="flex items-center gap-2"><MapPin size={14} /> {settings.address}</div>
          <div className="flex items-center gap-2"><Phone size={14} /> +977 {settings.phone}</div>
        </div>
      </div>

      {/* ENQUIRY BAR */}
      {enquiry.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center px-4 pb-4">
          <div
            style={{ background: C.ink, color: C.paper, fontFamily: FONT_BODY }}
            className="rounded-full shadow-lg px-5 py-3 flex items-center gap-4 max-w-md w-full"
          >
            <ShoppingBag size={18} />
            <span className="text-sm flex-1">{enquiry.length} style{enquiry.length > 1 ? "s" : ""} selected</span>
            <button
              onClick={() => setPanelOpen(true)}
              style={{ background: C.brass, color: C.ink }}
              className="text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              Review
            </button>
          </div>
        </div>
      )}

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setPanelOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: C.paper }}
            className="rounded-md max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: FONT_DISPLAY, color: C.ink }} className="text-lg font-bold">Enquiry List</h3>
              <button onClick={() => setPanelOpen(false)}><X size={18} /></button>
            </div>
            <div className="space-y-2 mb-5">
              {enquiry.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm" style={{ fontFamily: FONT_BODY }}>
                  <span>{p.name} <span className="opacity-50">({p.sku})</span></span>
                  <button onClick={() => toggleAdd(p)} className="opacity-60 hover:opacity-100"><X size={14} /></button>
                </div>
              ))}
            </div>
            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: C.olive, color: "#fff", fontFamily: FONT_BODY }}
              className="block text-center text-sm font-semibold py-3 rounded-sm"
            >
              Send Enquiry via WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Owner Row (editable ledger line)
--------------------------------------------------------- */
function OwnerRow({ p, onSave, onDelete, onStock }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(p);

  useEffect(() => setDraft(p), [p]);

  const status = p.stockDozens === 0 ? "out" : p.stockDozens < 4 ? "low" : "in";

  if (editing) {
    return (
      <tr style={{ background: "rgba(199,154,61,0.08)" }}>
        <td className="p-2" colSpan={7}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" style={{ fontFamily: FONT_BODY }}>
            <input className="text-sm px-2 py-1 rounded border col-span-2" value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Style name" />
            <select className="text-sm px-2 py-1 rounded border" value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className="text-sm px-2 py-1 rounded border" type="number" value={draft.pricePerDozen}
              onChange={(e) => setDraft({ ...draft, pricePerDozen: Number(e.target.value) })} placeholder="Price/dozen" />
            <input className="text-sm px-2 py-1 rounded border" type="number" value={draft.sizeMin}
              onChange={(e) => setDraft({ ...draft, sizeMin: Number(e.target.value) })} placeholder="Size min" />
            <input className="text-sm px-2 py-1 rounded border" type="number" value={draft.sizeMax}
              onChange={(e) => setDraft({ ...draft, sizeMax: Number(e.target.value) })} placeholder="Size max" />
            <input className="text-sm px-2 py-1 rounded border" type="number" value={draft.stockDozens}
              onChange={(e) => setDraft({ ...draft, stockDozens: Number(e.target.value) })} placeholder="Stock (dz)" />
            <input className="text-sm px-2 py-1 rounded border" type="number" value={draft.moq}
              onChange={(e) => setDraft({ ...draft, moq: Number(e.target.value) })} placeholder="MOQ" />
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => { onSave(draft); setEditing(false); }}
              style={{ background: C.olive, color: "#fff" }} className="text-xs px-3 py-1.5 rounded flex items-center gap-1">
              <Save size={12} /> Save
            </button>
            <button onClick={() => { setDraft(p); setEditing(false); }}
              className="text-xs px-3 py-1.5 rounded border">Cancel</button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ borderBottom: `1px solid ${C.paperLine}` }} className="text-sm">
      <td className="p-2" style={{ fontFamily: FONT_MONO }}>{p.sku}</td>
      <td className="p-2" style={{ fontFamily: FONT_BODY }}>
        <div className="font-semibold">{p.name}</div>
        <div className="text-xs opacity-50">{p.category} · sz {p.sizeMin}-{p.sizeMax}</div>
      </td>
      <td className="p-2" style={{ fontFamily: FONT_MONO }}>Rs {p.pricePerDozen.toLocaleString()}</td>
      <td className="p-2">
        <div className="flex items-center gap-1.5">
          <button onClick={() => onStock(p.id, -1)} style={{ border: `1px solid ${C.paperLine}` }} className="p-1 rounded"><Minus size={12} /></button>
          <span style={{ fontFamily: FONT_MONO }} className="w-6 text-center">{p.stockDozens}</span>
          <button onClick={() => onStock(p.id, 1)} style={{ border: `1px solid ${C.paperLine}` }} className="p-1 rounded"><Plus size={12} /></button>
        </div>
      </td>
      <td className="p-2"><StampBadge text={status === "out" ? "Sold Out" : status === "low" ? "Low" : "OK"} tone={status} /></td>
      <td className="p-2">
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="opacity-60 hover:opacity-100"><Pencil size={14} /></button>
          <button onClick={() => onDelete(p.id)} className="opacity-60 hover:opacity-100"><Trash2 size={14} /></button>
        </div>
      </td>
    </tr>
  );
}

/* ---------------------------------------------------------
   Owner View
--------------------------------------------------------- */
function OwnerView({ products, setProducts, settings, setSettings }) {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [settingsDraft, setSettingsDraft] = useState(settings);
  const [newProduct, setNewProduct] = useState({
    name: "", category: "Formal", sizeMin: 6, sizeMax: 10, stockDozens: 0, pricePerDozen: 0, moq: 2,
  });

  useEffect(() => setSettingsDraft(settings), [settings]);

  const lowStock = products.filter((p) => p.stockDozens < 4);

  const submitPin = (e) => {
    e.preventDefault();
    if (pin === OWNER_PIN) { setAuthed(true); setError(""); }
    else setError("Incorrect PIN. Try again.");
  };

  if (!authed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6" style={{ background: C.paperDark }}>
        <form onSubmit={submitPin} style={{ background: C.paper, border: `1px solid ${C.paperLine}` }} className="rounded-md p-8 max-w-xs w-full text-center">
          <Lock className="mx-auto mb-3" style={{ color: C.oxblood }} />
          <h2 style={{ fontFamily: FONT_DISPLAY, color: C.ink }} className="text-xl font-bold mb-1">Owner Access</h2>
          <p style={{ fontFamily: FONT_BODY }} className="text-xs opacity-60 mb-4">Enter the desk PIN to manage inventory.</p>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            type="password"
            inputMode="numeric"
            style={{ fontFamily: FONT_MONO, border: `1.4px solid ${C.paperLine}`, letterSpacing: "0.3em" }}
            className="w-full text-center text-lg px-3 py-2 rounded mb-3 focus:outline-none focus:ring-2"
            placeholder="····"
            autoFocus
          />
          {error && <div className="text-xs mb-3" style={{ color: C.oxblood }}>{error}</div>}
          <button style={{ background: C.ink, color: C.paper, fontFamily: FONT_BODY }} className="w-full text-sm font-semibold py-2 rounded">
            Unlock
          </button>
          <p style={{ fontFamily: FONT_MONO }} className="text-[10px] opacity-40 mt-4">Demo PIN: 2580 — change OWNER_PIN in code</p>
        </form>
      </div>
    );
  }

  const addProduct = () => {
    if (!newProduct.name.trim()) return;
    const p = { ...newProduct, id: uid(), sku: `KSC-${newProduct.category.slice(0, 2).toUpperCase()}${String(products.length + 1).padStart(2, "0")}` };
    setProducts((prev) => [p, ...prev]);
    setNewProduct({ name: "", category: "Formal", sizeMin: 6, sizeMax: 10, stockDozens: 0, pricePerDozen: 0, moq: 2 });
  };

  const saveProduct = (draft) => setProducts((prev) => prev.map((p) => (p.id === draft.id ? draft : p)));
  const deleteProduct = (id) => setProducts((prev) => prev.filter((p) => p.id !== id));
  const adjustStock = (id, delta) =>
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stockDozens: Math.max(0, p.stockDozens + delta) } : p)));

  return (
    <div style={{ background: C.paperDark }} className="min-h-[70vh] px-4 sm:px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <ClipboardList style={{ color: C.oxblood }} />
          <h2 style={{ fontFamily: FONT_DISPLAY, color: C.ink }} className="text-2xl font-bold">Warehouse Ledger</h2>
        </div>

        {lowStock.length > 0 && (
          <div style={{ background: "rgba(122,46,46,0.08)", border: `1px solid ${C.oxbloodLight}`, color: C.oxblood }}
            className="flex items-center gap-2 text-sm rounded-md px-4 py-2.5 mb-6">
            <AlertTriangle size={16} />
            <span style={{ fontFamily: FONT_BODY }}>{lowStock.length} style{lowStock.length > 1 ? "s" : ""} low or out of stock — restock soon.</span>
          </div>
        )}

        {/* Settings */}
        <div style={{ background: C.paper, border: `1px solid ${C.paperLine}` }} className="rounded-md p-5 mb-6">
          <h3 style={{ fontFamily: FONT_DISPLAY, color: C.ink }} className="font-bold mb-3 text-sm uppercase tracking-wide">Shop Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={settingsDraft.phone} onChange={(e) => setSettingsDraft({ ...settingsDraft, phone: e.target.value })}
              placeholder="WhatsApp number (977…)" className="text-sm px-3 py-2 rounded border" style={{ fontFamily: FONT_BODY }} />
            <input value={settingsDraft.address} onChange={(e) => setSettingsDraft({ ...settingsDraft, address: e.target.value })}
              placeholder="Shop address" className="text-sm px-3 py-2 rounded border sm:col-span-2" style={{ fontFamily: FONT_BODY }} />
          </div>
          <button onClick={() => setSettings(settingsDraft)} style={{ background: C.ink, color: C.paper, fontFamily: FONT_BODY }}
            className="mt-3 text-xs font-semibold px-4 py-2 rounded">Save Settings</button>
        </div>

        {/* Add new */}
        <div style={{ background: C.paper, border: `1px solid ${C.paperLine}` }} className="rounded-md p-5 mb-6">
          <h3 style={{ fontFamily: FONT_DISPLAY, color: C.ink }} className="font-bold mb-3 text-sm uppercase tracking-wide">Add New Style</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3" style={{ fontFamily: FONT_BODY }}>
            <input className="text-sm px-2 py-1.5 rounded border col-span-2" placeholder="Style name"
              value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
            <select className="text-sm px-2 py-1.5 rounded border" value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className="text-sm px-2 py-1.5 rounded border" type="number" placeholder="Price/dozen"
              value={newProduct.pricePerDozen} onChange={(e) => setNewProduct({ ...newProduct, pricePerDozen: Number(e.target.value) })} />
            <input className="text-sm px-2 py-1.5 rounded border" type="number" placeholder="Size min"
              value={newProduct.sizeMin} onChange={(e) => setNewProduct({ ...newProduct, sizeMin: Number(e.target.value) })} />
            <input className="text-sm px-2 py-1.5 rounded border" type="number" placeholder="Size max"
              value={newProduct.sizeMax} onChange={(e) => setNewProduct({ ...newProduct, sizeMax: Number(e.target.value) })} />
            <input className="text-sm px-2 py-1.5 rounded border" type="number" placeholder="Stock (dz)"
              value={newProduct.stockDozens} onChange={(e) => setNewProduct({ ...newProduct, stockDozens: Number(e.target.value) })} />
            <input className="text-sm px-2 py-1.5 rounded border" type="number" placeholder="MOQ (dz)"
              value={newProduct.moq} onChange={(e) => setNewProduct({ ...newProduct, moq: Number(e.target.value) })} />
          </div>
          <button onClick={addProduct} style={{ background: C.olive, color: "#fff", fontFamily: FONT_BODY }}
            className="text-xs font-semibold px-4 py-2 rounded flex items-center gap-1"><Plus size={14} /> Add to Ledger</button>
        </div>

        {/* Table */}
        <div style={{ background: C.paper, border: `1px solid ${C.paperLine}` }} className="rounded-md overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr style={{ background: C.ink, color: C.paper, fontFamily: FONT_MONO }} className="text-[11px] uppercase tracking-wide">
                <th className="text-left p-2">SKU</th>
                <th className="text-left p-2">Style</th>
                <th className="text-left p-2">Price/dz</th>
                <th className="text-left p-2">Stock</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <OwnerRow key={p.id} p={p} onSave={saveProduct} onDelete={deleteProduct} onStock={adjustStock} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   App
--------------------------------------------------------- */
export default function App() {
  const [view, setView] = useState("client");
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const firstRun = useRef(true);

  // NOTE: this uses the browser's localStorage, which saves data only on
  // THIS device/browser. Owner edits made on one phone/laptop won't appear
  // for customers browsing on their own phones. For a real shared catalog
  // across devices, swap this for a small backend (Firebase/Supabase are
  // the easiest free options) — ask Claude to wire that in when ready.
  useEffect(() => {
    try {
      const p = localStorage.getItem("ksc-products");
      if (p) setProducts(JSON.parse(p));
    } catch (e) { /* no data yet — keep defaults */ }
    try {
      const s = localStorage.getItem("ksc-settings");
      if (s) setSettings(JSON.parse(s));
    } catch (e) { /* no data yet — keep defaults */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("ksc-products", JSON.stringify(products)); } catch (e) {}
  }, [products, loaded]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("ksc-settings", JSON.stringify(settings)); } catch (e) {}
  }, [settings, loaded]);

  return (
    <div style={{ fontFamily: FONT_BODY, background: C.paperDark, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bitter:wght@400;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <header style={{ background: C.ink, borderBottom: `1px solid ${C.inkFaint}` }} className="sticky top-0 z-30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoeMark size={20} />
          <span style={{ fontFamily: FONT_DISPLAY, color: C.paper }} className="font-bold tracking-tight">Krishna Shoe Center</span>
        </div>
        <div className="flex gap-1 rounded-full p-1" style={{ background: C.inkFaint }}>
          {[
            ["client", "Shop", Store],
            ["owner", "Owner Desk", Lock],
          ].map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              style={{
                background: view === key ? C.brass : "transparent",
                color: view === key ? C.ink : C.paper,
                fontFamily: FONT_BODY,
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2"
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </header>

      {!loaded ? (
        <div className="flex items-center justify-center py-32 opacity-50" style={{ fontFamily: FONT_MONO }}>
          <RotateCcw className="animate-spin mr-2" size={16} /> loading ledger…
        </div>
      ) : view === "client" ? (
        <ClientView products={products} settings={settings} />
      ) : (
        <OwnerView products={products} setProducts={setProducts} settings={settings} setSettings={setSettings} />
      )}
    </div>
  );
}
