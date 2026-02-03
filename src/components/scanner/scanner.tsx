'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const Scanner = () => {
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const [upiData, setUpiData] = useState({
        pa: '',
        am: '',
        tn: '',
        category: ''
    });

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const readerDivRef = useRef<HTMLDivElement>(null);

    /** ---------- Scanner lifecycle helpers ---------- */
    const stopScanner = async () => {
        if (!scannerRef.current) return;

        try {
            await scannerRef.current.stop();
        } catch {
            // ignore
        }

        scannerRef.current = null;
        if (readerDivRef.current) {
            readerDivRef.current.innerHTML = '';
        }
    };

    /** ---------- Effect: start / stop scanner ---------- */
    useEffect(() => {
        if (!isScanning) {
            stopScanner();
            return;
        }

        // Guard: prevent double start
        if (scannerRef.current) return;

        const startScanner = async () => {
            try {
                const scanner = new Html5Qrcode('reader');
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    handleScan,
                    () => {}
                );
            } catch (err) {
                console.error('Failed to start scanner:', err);
                setIsScanning(false);
            }
        };

        startScanner();
    }, [isScanning]);

    /** ---------- Scan handler ---------- */
    const handleScan = async (data: string) => {
        let receiverId = '';

        if (data.startsWith('upi://pay')) {
            const url = new URL(data.replace('upi://pay', 'https://upi.com'));
            receiverId = url.searchParams.get('pa') || '';
        } else if (data.includes('@')) {
            receiverId = data;
        }

        if (!receiverId) {
            alert('Invalid UPI QR Code');
            return;
        }

        // 🔴 Stop scanner immediately after success
        await stopScanner();
        setIsScanning(false);

        setUpiData(prev => ({ ...prev, pa: receiverId }));
        setShowPaymentForm(true);
    };

    /** ---------- Payment ---------- */
    const makePayment = () => {
        const { pa, am } = upiData;

        if (!am) {
            alert('Please enter an amount');
            return;
        }

        const upiUrl = `phonepe://pay?pa=${pa}&pn=Recipient&am=${am}`;
        window.location.href = upiUrl;
    };

    /** ---------- Form helpers ---------- */
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setUpiData(prev => ({ ...prev, [id]: value }));
    };

    const handleCancelPayment = () => {
        setUpiData({ pa: '', am: '', tn: '', category: '' });
        setShowPaymentForm(false);
        setIsScanning(true); // 🔁 restart scanner cleanly
    };

    const startScanning = () => setIsScanning(true);

    const cancelScanning = () => {
        setIsScanning(false);
        setShowPaymentForm(false);
    };

    /** ---------- UI ---------- */
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
                                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl"
                            >
                                Start Scanning
                            </button>
                        ) : (
                            <>
                                <div className="bg-white rounded-2xl shadow-xl p-4">
                                    <div
                                        ref={readerDivRef}
                                        id="reader"
                                        className="w-full min-h-72 rounded-xl bg-slate-100"
                                    />
                                </div>

                                <button
                                    onClick={cancelScanning}
                                    className="w-full py-4 bg-red-600 text-white font-bold rounded-xl"
                                >
                                    Cancel Scanning
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <h2 className="text-xl font-bold mb-6">Payment Details</h2>

                        <div className="bg-blue-50 rounded-xl p-4 mb-6">
                            <p className="text-xs font-semibold text-blue-600">Receiver</p>
                            <p className="text-lg font-medium truncate">{upiData.pa}</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="number"
                                id="am"
                                value={upiData.am}
                                onChange={handleInputChange}
                                placeholder="Amount"
                                className="w-full px-4 py-3 border rounded-xl text-black"
                            />

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleCancelPayment}
                                    className="flex-1 py-4 bg-slate-100 font-bold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={makePayment}
                                    className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl"
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
