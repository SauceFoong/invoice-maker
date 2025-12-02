import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Printer, Download, Plus, Trash2, RefreshCw, FileText, FileCheck, X } from 'lucide-react';

// Signature Pad Component
const SignaturePad = ({ onSave, onClear, signature, label }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // If there's an existing signature, draw it
    if (signature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = signature;
    }
  }, [signature]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && hasDrawn) {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onClear();
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-medium text-emerald-700">{label}</label>
        <button
          type="button"
          onClick={clearSignature}
          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
        >
          <X size={12} /> Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={280}
        height={100}
        className="border-2 border-dashed border-emerald-300 rounded-lg cursor-crosshair bg-white w-full touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <p className="text-xs text-emerald-500 text-center">Draw your signature above</p>
    </div>
  );
};

const App = () => {
  const invoiceRef = useRef(null);
  const [isSdkReady, setIsSdkReady] = useState(false);
  
  // Tab state: 'invoice' or 'quotation'
  const [activeTab, setActiveTab] = useState('invoice');

  // --- State for Document Data ---
  const [documentData, setDocumentData] = useState({
    companyName: 'Saucy Web Dev Agency',
    billTo: 'Westbro Catering Service',
    documentNumber: 'A3000',
    documentDate: '2025-11-24',
    currency: 'RM',
    items: [
      { id: 1, description: 'Domain Renewal Fee (1 year)', amount: 140.00 },
      { id: 2, description: 'Hosting Renewal Fee (1 year)', amount: 550.00 },
    ],
    terms: 'Payment is due within 15 days',
    // Fixed price mode - shows items without individual prices, just a total
    fixedPriceMode: false,
    fixedTotal: 0,
    additionalNotes: '', // e.g., "Timeline: 5 working days"
    // Quotation specific fields
    validityDays: 30,
    providerName: '',
    clientName: '',
    // Signature data
    providerSignature: null,
    clientSignature: null,
    providerSignDate: '',
    clientSignDate: '',
  });

  // --- Helper Functions ---

  // Load html2pdf.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.async = true;
    script.onload = () => setIsSdkReady(true);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Calculate Total
  const calculateTotal = () => {
    if (documentData.fixedPriceMode) {
      return parseFloat(documentData.fixedTotal || 0).toFixed(2);
    }
    return documentData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2);
  };

  // Format Date for Display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Calculate validity end date
  const getValidityEndDate = () => {
    if (!documentData.documentDate) return '';
    const date = new Date(documentData.documentDate);
    date.setDate(date.getDate() + parseInt(documentData.validityDays || 30));
    return formatDate(date.toISOString().split('T')[0]);
  };

  // Handle General Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDocumentData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Item Changes
  const handleItemChange = (id, field, value) => {
    setDocumentData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, [field]: field === 'amount' ? parseFloat(value) : value } : item
      )
    }));
  };

  // Add New Item
  const addItem = () => {
    const newId = documentData.items.length > 0 ? Math.max(...documentData.items.map(i => i.id)) + 1 : 1;
    setDocumentData(prev => ({
      ...prev,
      items: [...prev.items, { id: newId, description: 'New Service Item', amount: 0 }]
    }));
  };

  // Remove Item
  const removeItem = (id) => {
    setDocumentData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  // Signature handlers
  const handleProviderSignature = useCallback((dataUrl) => {
    setDocumentData(prev => ({ ...prev, providerSignature: dataUrl }));
  }, []);

  const handleClientSignature = useCallback((dataUrl) => {
    setDocumentData(prev => ({ ...prev, clientSignature: dataUrl }));
  }, []);

  const clearProviderSignature = useCallback(() => {
    setDocumentData(prev => ({ ...prev, providerSignature: null }));
  }, []);

  const clearClientSignature = useCallback(() => {
    setDocumentData(prev => ({ ...prev, clientSignature: null }));
  }, []);

  // PDF Actions
  const handlePrint = () => window.print();

  const handleDownload = () => {
    if (!isSdkReady || !window.html2pdf) return;
    const element = invoiceRef.current;
    const prefix = activeTab === 'quotation' ? 'Quotation' : 'Invoice';
    const opt = {
      margin: 10,
      filename: `${prefix}_${documentData.documentNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf().set(opt).from(element).save();
  };

  // Get document type labels
  const getDocumentLabel = () => activeTab === 'quotation' ? 'Quotation' : 'Invoice';
  const getDocumentNumberLabel = () => activeTab === 'quotation' ? 'Quote #' : 'Invoice #';

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col lg:flex-row print:block">
      
      {/* --- LEFT PANEL: EDITOR (Hidden when printing) --- */}
      <div className="w-full lg:w-5/12 bg-white border-r border-gray-200 h-auto lg:h-screen overflow-y-auto p-6 shadow-xl z-10 print:hidden">
        <div className="flex items-center gap-2 mb-6">
           <div className="bg-indigo-600 p-2 rounded-lg">
             <RefreshCw className="text-white w-5 h-5" />
           </div>
           <h2 className="text-xl font-bold text-gray-800">Saucy Doc Maker</h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('invoice')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === 'invoice'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText size={16} />
            Invoice
          </button>
          <button
            onClick={() => setActiveTab('quotation')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === 'quotation'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileCheck size={16} />
            Quotation
          </button>
        </div>

        <div className="space-y-6">
          {/* Company Details */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Service Provider Details</h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Your Company Name</label>
              <input
                type="text"
                name="companyName"
                value={documentData.companyName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Terms & Conditions</label>
              <textarea
                name="terms"
                value={documentData.terms}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Client Details */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Client & {getDocumentLabel()} Info</h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {activeTab === 'quotation' ? 'Quote To (Client Name)' : 'Bill To (Client Name)'}
              </label>
              <input
                type="text"
                name="billTo"
                value={documentData.billTo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{getDocumentNumberLabel()}</label>
                <input
                  type="text"
                  name="documentNumber"
                  value={documentData.documentNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{getDocumentLabel()} Date</label>
                <input
                  type="date"
                  name="documentDate"
                  value={documentData.documentDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Validity Period - Quotation Only */}
            {activeTab === 'quotation' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Quote Valid For (Days)</label>
                <input
                  type="number"
                  name="validityDays"
                  value={documentData.validityDays}
                  onChange={handleInputChange}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}

             <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                name="currency"
                value={documentData.currency}
                onChange={handleInputChange}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Signature Section - Quotation Only */}
          {activeTab === 'quotation' && (
            <div className="space-y-4 bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Signatures</h3>
              <p className="text-xs text-emerald-600">Draw signatures and enter signing dates</p>
              
              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-emerald-700 mb-1">Service Provider Name</label>
                  <input
                    type="text"
                    name="providerName"
                    value={documentData.providerName}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-emerald-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-emerald-700 mb-1">Client Name</label>
                  <input
                    type="text"
                    name="clientName"
                    value={documentData.clientName}
                    onChange={handleInputChange}
                    placeholder="Client's name"
                    className="w-full px-3 py-2 border border-emerald-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Signature Pads */}
              <div className="grid grid-cols-1 gap-4">
                <SignaturePad
                  label="Service Provider Signature"
                  signature={documentData.providerSignature}
                  onSave={handleProviderSignature}
                  onClear={clearProviderSignature}
                />
                <SignaturePad
                  label="Client Signature"
                  signature={documentData.clientSignature}
                  onSave={handleClientSignature}
                  onClear={clearClientSignature}
                />
              </div>

              {/* Sign Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-emerald-700 mb-1">Service Provider Sign Date</label>
                  <input
                    type="date"
                    name="providerSignDate"
                    value={documentData.providerSignDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-emerald-700 mb-1">Client Sign Date</label>
                  <input
                    type="date"
                    name="clientSignDate"
                    value={documentData.clientSignDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pricing Mode Toggle */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-amber-800">Fixed Price Mode</h3>
                <p className="text-xs text-amber-600 mt-1">List items without individual prices, show only total</p>
              </div>
              <button
                onClick={() => setDocumentData(prev => ({ ...prev, fixedPriceMode: !prev.fixedPriceMode }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${documentData.fixedPriceMode ? 'bg-amber-500' : 'bg-gray-300'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${documentData.fixedPriceMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            
            {documentData.fixedPriceMode && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-amber-800 mb-1">Total Amount</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-amber-700">{documentData.currency}</span>
                    <input
                      type="number"
                      name="fixedTotal"
                      value={documentData.fixedTotal}
                      onChange={handleInputChange}
                      placeholder="2500.00"
                      className="flex-1 px-3 py-2 border border-amber-300 rounded-md focus:ring-amber-500 focus:border-amber-500 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-800 mb-1">Additional Notes (e.g., Timeline)</label>
                  <textarea
                    name="additionalNotes"
                    value={documentData.additionalNotes}
                    onChange={handleInputChange}
                    placeholder="Timeline: 5 working days"
                    rows="2"
                    className="w-full px-3 py-2 border border-amber-300 rounded-md focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Line Items Editor */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Line Items</h3>
               <button 
                onClick={addItem}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
               >
                 <Plus size={16} /> Add Item
               </button>
            </div>
            
            {documentData.items.map((item, index) => (
              <div key={item.id} className="flex gap-2 items-start bg-white p-2 border border-gray-200 rounded-md shadow-sm">
                <span className="text-xs text-gray-400 mt-2 w-5">{index + 1}.</span>
                <div className="flex-grow">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    placeholder="Description"
                    className={`w-full p-1 text-sm border-b border-gray-200 focus:border-indigo-500 outline-none ${documentData.fixedPriceMode ? '' : 'mb-1'}`}
                  />
                  {!documentData.fixedPriceMode && (
                    <div className="flex items-center gap-2">
                       <span className="text-xs text-gray-400">{documentData.currency}</span>
                       <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                        placeholder="0.00"
                        className="w-full p-1 text-sm outline-none"
                      />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-gray-400 hover:text-red-500"
                  title="Remove Item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          
          {/* Action Buttons (Mobile Only - they appear in sticky header on desktop) */}
           <div className="pt-6 border-t border-gray-200 flex gap-3 lg:hidden">
             <button
                onClick={handlePrint}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                <Printer className="mr-2 h-4 w-4" /> Print
              </button>
              <button
                onClick={handleDownload}
                disabled={!isSdkReady}
                className={`flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isSdkReady ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-400'}`}
              >
                <Download className="mr-2 h-4 w-4" /> PDF
              </button>
           </div>
        </div>
      </div>

      {/* --- RIGHT PANEL: PREVIEW (Visible always, main content for print) --- */}
      <div className="w-full lg:w-7/12 bg-gray-100 h-auto lg:h-screen overflow-y-auto p-4 lg:p-8 print:w-full print:h-auto print:overflow-visible print:bg-white print:p-0">
        
        {/* Desktop Actions */}
        <div className="hidden lg:flex justify-end gap-3 mb-6 print:hidden sticky top-0 z-20">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </button>
          
          <button
            onClick={handleDownload}
            disabled={!isSdkReady}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isSdkReady ? (activeTab === 'quotation' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700') : 'bg-gray-400 cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            <Download className="mr-2 h-4 w-4" />
            {isSdkReady ? `Download ${getDocumentLabel()} PDF` : 'Loading...'}
          </button>
        </div>

        {/* --- THE DOCUMENT --- */}
        <div 
          ref={invoiceRef}
          className="max-w-[210mm] mx-auto bg-white shadow-2xl rounded-lg overflow-hidden print:shadow-none print:max-w-full print:rounded-none min-h-[297mm]"
          id="invoice-content"
        >
          <div className="p-8 md:p-12 relative h-full flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-wide">{documentData.companyName || 'Company Name'}</h1>
              </div>
              {/* Document Type Badge */}
              <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                activeTab === 'quotation' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-indigo-100 text-indigo-700'
              }`}>
                {getDocumentLabel().toUpperCase()}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  {activeTab === 'quotation' ? 'Quote To' : 'Bill To'}
                </h2>
                <p className="text-lg font-semibold text-gray-900 break-words whitespace-pre-wrap">{documentData.billTo || 'Client Name'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{getDocumentNumberLabel()}</h2>
                  <p className="text-lg font-semibold text-gray-900">{documentData.documentNumber}</p>
                </div>
                <div>
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{getDocumentLabel()} Date</h2>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(documentData.documentDate)}</p>
                </div>
                {activeTab === 'quotation' && (
                  <div className="col-span-2 mt-2">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Valid Until</h2>
                    <p className="text-md font-semibold text-gray-700">{getValidityEndDate()}</p>
                  </div>
                )}
                <div className={`col-span-2 mt-4 p-2 rounded ${activeTab === 'quotation' ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{getDocumentLabel()} Total</h2>
                  <p className={`text-2xl font-bold break-all ${activeTab === 'quotation' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                    {documentData.currency} {calculateTotal()}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-auto">
              {documentData.fixedPriceMode ? (
                /* Fixed Price Mode - List style without amounts */
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b-2 border-gray-200">Scope of Work</h3>
                  <ol className="space-y-3 text-sm text-gray-900">
                    {documentData.items.map((item, index) => (
                      <li key={item.id} className="flex gap-3 py-2 border-b border-gray-100">
                        <span className="text-gray-500 font-medium">{index + 1}.</span>
                        <span className="flex-1">{item.description}</span>
                      </li>
                    ))}
                    {documentData.items.length === 0 && (
                      <li className="py-8 text-center text-gray-400 italic">No items added yet.</li>
                    )}
                  </ol>
                  
                  {/* Total Offer Section */}
                  <div className="mt-8 pt-6 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">Total {activeTab === 'quotation' ? 'Quote' : 'Offer'}</span>
                      <span className={`text-2xl font-bold ${activeTab === 'quotation' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                        {documentData.currency} {calculateTotal()}
                      </span>
                    </div>
                    {documentData.additionalNotes && (
                      <p className="mt-3 text-sm text-gray-600 whitespace-pre-wrap">{documentData.additionalNotes}</p>
                    )}
                  </div>
                </div>
              ) : (
                /* Regular Mode - Table with amounts */
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="py-4 px-2 border-b-2 border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="py-4 px-2 border-b-2 border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider text-right w-40">Amount ({documentData.currency})</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {documentData.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-4 px-2 border-b border-gray-100 text-gray-900">{item.description}</td>
                        <td className="py-4 px-2 border-b border-gray-100 text-gray-900 text-right font-medium">
                          {parseFloat(item.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {documentData.items.length === 0 && (
                      <tr>
                        <td colSpan="2" className="py-8 text-center text-gray-400 italic">No items added yet.</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="pt-6 px-2 text-right text-sm font-bold text-gray-900">Total</td>
                      <td className="pt-6 px-2 text-right text-lg font-bold text-gray-900">
                        {documentData.currency} {calculateTotal()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Terms */}
            <div className="border-t border-gray-200 pt-8 mt-12">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Terms & Conditions</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{documentData.terms}</p>
            </div>

            {/* Signature Section - Quotation Only */}
            {activeTab === 'quotation' && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-8">Agreement & Signatures</h3>
                <p className="text-sm text-gray-600 mb-8">
                  By signing below, both parties agree to the terms and scope of work outlined in this quotation.
                </p>
                <div className="grid grid-cols-2 gap-12">
                  {/* Service Provider Signature */}
                  <div>
                    {documentData.providerSignature ? (
                      <div className="h-20 mb-2 border-b-2 border-gray-300 flex items-end justify-center pb-1">
                        <img 
                          src={documentData.providerSignature} 
                          alt="Service Provider Signature" 
                          className="max-h-16 max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="border-b-2 border-gray-300 h-20 mb-2"></div>
                    )}
                    <p className="text-sm font-semibold text-gray-900">{documentData.providerName || 'Service Provider Name'}</p>
                    <p className="text-xs text-gray-500 mt-1">{documentData.companyName}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Date: {documentData.providerSignDate ? formatDate(documentData.providerSignDate) : '_______________'}
                    </p>
                  </div>
                  {/* Client Signature */}
                  <div>
                    {documentData.clientSignature ? (
                      <div className="h-20 mb-2 border-b-2 border-gray-300 flex items-end justify-center pb-1">
                        <img 
                          src={documentData.clientSignature} 
                          alt="Client Signature" 
                          className="max-h-16 max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="border-b-2 border-gray-300 h-20 mb-2"></div>
                    )}
                    <p className="text-sm font-semibold text-gray-900">{documentData.clientName || 'Client Name'}</p>
                    <p className="text-xs text-gray-500 mt-1">{documentData.billTo}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Date: {documentData.clientSignDate ? formatDate(documentData.clientSignDate) : '_______________'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className={`h-2 w-full print:hidden mt-auto ${activeTab === 'quotation' ? 'bg-emerald-600' : 'bg-indigo-600'}`}></div>
        </div>
        
        <div className="max-w-[210mm] mx-auto mt-4 text-center text-gray-400 text-xs print:hidden">
          <p>Preview matches final PDF output.</p>
        </div>
      </div>
    </div>
  );
};

export default App;
