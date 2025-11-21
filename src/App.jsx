import React, { useRef, useEffect, useState } from 'react';
import { Printer, Download, Plus, Trash2, RefreshCw } from 'lucide-react';

const App = () => {
  const invoiceRef = useRef(null);
  const [isSdkReady, setIsSdkReady] = useState(false);

  // --- State for Invoice Data ---
  const [invoiceData, setInvoiceData] = useState({
    companyName: 'Saucy Web Dev Agency',
    billTo: 'Westbro Catering Service',
    invoiceNumber: 'A3000',
    invoiceDate: '2025-11-24',
    currency: 'RM',
    items: [
      { id: 1, description: 'Domain Renewal Fee (1 year)', amount: 140.00 },
      { id: 2, description: 'Hosting Renewal Fee (1 year)', amount: 550.00 },
    ],
    terms: 'Payment is due within 15 days'
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
    return invoiceData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2);
  };

  // Format Date for Display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Handle General Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Item Changes
  const handleItemChange = (id, field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, [field]: field === 'amount' ? parseFloat(value) : value } : item
      )
    }));
  };

  // Add New Item
  const addItem = () => {
    const newId = invoiceData.items.length > 0 ? Math.max(...invoiceData.items.map(i => i.id)) + 1 : 1;
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { id: newId, description: 'New Service Item', amount: 0 }]
    }));
  };

  // Remove Item
  const removeItem = (id) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  // PDF Actions
  const handlePrint = () => window.print();

  const handleDownload = () => {
    if (!isSdkReady || !window.html2pdf) return;
    const element = invoiceRef.current;
    const opt = {
      margin: 10,
      filename: `Invoice_${invoiceData.invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col lg:flex-row print:block">
      
      {/* --- LEFT PANEL: EDITOR (Hidden when printing) --- */}
      <div className="w-full lg:w-5/12 bg-white border-r border-gray-200 h-auto lg:h-screen overflow-y-auto p-6 shadow-xl z-10 print:hidden">
        <div className="flex items-center gap-2 mb-6">
           <div className="bg-indigo-600 p-2 rounded-lg">
             <RefreshCw className="text-white w-5 h-5" />
           </div>
           <h2 className="text-xl font-bold text-gray-800">Saucy Invoice Maker</h2>
        </div>

        <div className="space-y-6">
          {/* Company Details */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sender Details</h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Your Company Name</label>
              <input
                type="text"
                name="companyName"
                value={invoiceData.companyName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Terms & Conditions</label>
              <textarea
                name="terms"
                value={invoiceData.terms}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Client Details */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Client & Invoice Info</h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bill To (Client Name)</label>
              <input
                type="text"
                name="billTo"
                value={invoiceData.billTo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Number</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={invoiceData.invoiceNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Date</label>
                <input
                  type="date"
                  name="invoiceDate"
                  value={invoiceData.invoiceDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
             <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                name="currency"
                value={invoiceData.currency}
                onChange={handleInputChange}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
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
            
            {invoiceData.items.map((item) => (
              <div key={item.id} className="flex gap-2 items-start bg-white p-2 border border-gray-200 rounded-md shadow-sm">
                <div className="flex-grow">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    placeholder="Description"
                    className="w-full p-1 text-sm border-b border-gray-200 focus:border-indigo-500 outline-none mb-1"
                  />
                  <div className="flex items-center gap-2">
                     <span className="text-xs text-gray-400">{invoiceData.currency}</span>
                     <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                      placeholder="0.00"
                      className="w-full p-1 text-sm outline-none"
                    />
                  </div>
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
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isSdkReady ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-400 cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            <Download className="mr-2 h-4 w-4" />
            {isSdkReady ? 'Download PDF' : 'Loading...'}
          </button>
        </div>

        {/* --- THE INVOICE DOCUMENT --- */}
        <div 
          ref={invoiceRef}
          className="max-w-[210mm] mx-auto bg-white shadow-2xl rounded-lg overflow-hidden print:shadow-none print:max-w-full print:rounded-none min-h-[297mm]"
          id="invoice-content"
        >
          <div className="p-8 md:p-12 relative h-full flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-wide">{invoiceData.companyName || 'Company Name'}</h1>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Bill To</h2>
                <p className="text-lg font-semibold text-gray-900 break-words whitespace-pre-wrap">{invoiceData.billTo || 'Client Name'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Invoice #</h2>
                  <p className="text-lg font-semibold text-gray-900">{invoiceData.invoiceNumber}</p>
                </div>
                <div>
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Invoice Date</h2>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(invoiceData.invoiceDate)}</p>
                </div>
                <div className="col-span-2 mt-4 bg-gray-50 p-2 rounded">
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Invoice Total</h2>
                  <p className="text-2xl font-bold text-indigo-600 break-all">
                    {invoiceData.currency} {calculateTotal()}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="py-4 px-2 border-b-2 border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="py-4 px-2 border-b-2 border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider text-right w-40">Amount ({invoiceData.currency})</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {invoiceData.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 px-2 border-b border-gray-100 text-gray-900">{item.description}</td>
                      <td className="py-4 px-2 border-b border-gray-100 text-gray-900 text-right font-medium">
                        {parseFloat(item.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {invoiceData.items.length === 0 && (
                    <tr>
                      <td colSpan="2" className="py-8 text-center text-gray-400 italic">No items added yet.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="pt-6 px-2 text-right text-sm font-bold text-gray-900">Total</td>
                    <td className="pt-6 px-2 text-right text-lg font-bold text-gray-900">
                      {invoiceData.currency} {calculateTotal()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Terms */}
            <div className="border-t border-gray-200 pt-8 mt-12">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Terms & Conditions</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoiceData.terms}</p>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="h-2 bg-indigo-600 w-full print:hidden mt-auto"></div>
        </div>
        
        <div className="max-w-[210mm] mx-auto mt-4 text-center text-gray-400 text-xs print:hidden">
          <p>Preview matches final PDF output.</p>
        </div>
      </div>
    </div>
  );
};

export default App;
