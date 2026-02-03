'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const Scanner = () => {
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [upiData, setUpiData] = useState({
        pa: '', // Receiver VPA (UPI ID)
        am: '', // Amount
        tn: '', // Transaction Note (Reason)
        category: '' // Extra field for your use
    });

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const readerDivRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Only start scanner if explicitly requested
        if (!isScanning) {
            // Cleanup when stopping
            if (scannerRef.current) {
                scannerRef.current.stop()
                    .then(() => {
                        scannerRef.current = null;
                        if (readerDivRef.current) readerDivRef.current.innerHTML = "";
                    })
                    .catch(() => {
                        // Scanner wasn't running, just clear the reference
                        scannerRef.current = null;
                    });
            }
            return;
        }

        const startScanner = async () => {
            try {
                // Ensure any old instance is cleaned up
                if (scannerRef.current) {
                    try {
                        await scannerRef.current.stop();
                    } catch {
                        // Ignore stop errors
                    }
                    scannerRef.current = null;
                }

                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        handleScan(decodedText);
                    },
                    () => { /* Silent failure for scan attempts */ }
                );
            } catch (err) {
                console.error("Failed to start scanner:", err);
                setIsScanning(false);
            }
        };

        startScanner();
    }, [isScanning]);

    const handleScan = (data: string) => {
        let receiverId = "";

        // Standard UPI QR check
        if (data.startsWith("upi://pay")) {
            const urlParts = new URL(data.replace('upi://pay', 'https://upi.com'));
            receiverId = urlParts.searchParams.get("pa") || "";
        } else if (data.includes("@")) {
            // Simple text QR containing only the UPI ID
            receiverId = data;
        }

        if (receiverId) {
            setUpiData(prev => ({ ...prev, pa: receiverId }));
            setShowPaymentForm(true);
        } else {
            alert("Invalid UPI QR Code");
        }
    };

    const makePayment = () => {
        const { pa, am, tn, category } = upiData;

        if (!am) {
            alert("Please enter an amount");
            return;
        }

        // Combine reason and category for the UPI note parameter 'tn'
        // const fullNote = `${tn} ${category ? '(' + category + ')' : ''}`.trim();
        
        // Build UPI link
        // pa = Address, am = Amount, tn = Note, cu = Currency
        // const upiUrl = `upi://pay?pa=${pa}&pn=Recipient&am=${am}&tn=${encodeURIComponent(fullNote)}&cu=INR`;
        // const upiUrl = `upi://pay?pa=${pa}&pn=Recipient&am=${am}`;
        const upiUrl = `phonepe://pay?pa=${pa}&pn=Recipient&am=${am}`;

        window.location.href = upiUrl;
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setUpiData(prev => ({ ...prev, [id]: value }));
    };

    const handleCancel = () => {
        setUpiData({ pa: '', am: '', tn: '', category: '' });
        setShowPaymentForm(false);
    };

    const startScanning = () => {
        setIsScanning(true);
    };

    const stopScanning = () => {
        setIsScanning(false);
        setShowPaymentForm(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-slate-900">Scan & Pay</h1>
                    <p className="text-slate-600 mt-2">Scan any UPI QR code to begin</p>
                </div>

                {!showPaymentForm ? (
                    <div className="space-y-4">
                        {!isScanning ? (
                            <button
                                onClick={startScanning}
                                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                            >
                                Start Scanning
                            </button>
                        ) : (
                            <>
                                <div className="bg-white rounded-2xl shadow-xl p-4">
                                    <div
                                        ref={readerDivRef}
                                        id="reader"
                                        className="w-full overflow-hidden rounded-xl bg-slate-100 min-h-75"
                                    />
                                </div>
                                <button
                                    onClick={stopScanning}
                                    className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                                >
                                    Cancel Scanning
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-xl p-6 animate-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Payment Details</h2>
                        
                        <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Receiver ID</p>
                            <p className="text-lg font-medium text-slate-900 truncate">{upiData.pa}</p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    id="am"
                                    value={upiData.am}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Reason</label>
                                    <input
                                        type="text"
                                        id="tn"
                                        value={upiData.tn}
                                        onChange={handleInputChange}
                                        placeholder="Dinner"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                                    <input
                                        type="text"
                                        id="category"
                                        value={upiData.category}
                                        onChange={handleInputChange}
                                        placeholder="Food"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={makePayment}
                                    className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                                >
                                    Pay Now
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};