import React, { useState, useRef } from 'react';
import { paymentService } from '../services/api';
import { compressImage } from '../utils/imageUtils';
import './PaymentProofUpload.css';

const PaymentProofUpload = ({ paymentId, amount, onComplete, onCancel }) => {
    const [method, setMethod] = useState('easypaisa'); // 'easypaisa' or 'jazzcash'
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef();

    // Placeholder details - suggest user to update these
    const accounts = {
        easypaisa: {
            name: 'Agro Tree Admin',
            number: '0300 1234567',
            color: '#10b981',
            logo: 'https://seeklogo.com/images/E/easypaisa-logo-7E3E1A6D2F-seeklogo.com.png'
        },
        jazzcash: {
            name: 'Agro Tree Admin',
            number: '0300 1234567',
            color: '#ef4444',
            logo: 'https://seeklogo.com/images/J/jazzcash-logo-820FC265B5-seeklogo.com.png'
        }
    };

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (!selectedFile.type.startsWith('image/')) {
            setError('Please upload an image file (Screenshot or Photo)');
            return;
        }

        try {
            setUploading(true);
            const compressedFile = await compressImage(selectedFile, { maxWidth: 1200, quality: 0.7 });
            setFile(compressedFile);
            setPreview(URL.createObjectURL(compressedFile));
            setError(null);
        } catch (err) {
            setError('Failed to process image. Please try another.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            setError('Please upload a proof of payment screenshot');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            // 1. Upload the image to Cloudinary
            const formData = new FormData();
            formData.append('proof', file);
            const { proofUrl } = await paymentService.uploadProof(paymentId, formData);

            // 2. Confirm the payment with proofUrl
            await paymentService.confirmWithProof({
                paymentId,
                proofUrl,
                paymentMethod: method,
                accountName: accounts[method].name,
                accountNumber: accounts[method].number
            });

            onComplete && onComplete();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit proof. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="proof-upload-container animate-fade-in">
            <div className="payment-method-selector">
                <button 
                    className={`method-tab ${method === 'easypaisa' ? 'active easypaisa' : ''}`}
                    onClick={() => setMethod('easypaisa')}
                >
                    EasyPaisa
                </button>
                <button 
                    className={`method-tab ${method === 'jazzcash' ? 'active jazzcash' : ''}`}
                    onClick={() => setMethod('jazzcash')}
                >
                    JazzCash
                </button>
            </div>

            <div className="account-details-card" style={{ '--brand-color': accounts[method].color }}>
                <div className="card-glare"></div>
                <div className="account-header">
                    <img src={accounts[method].logo} alt={method} className="method-logo-small" />
                    <span className="badge">Official Account</span>
                </div>
                
                <div className="detail-row">
                    <label>Account Title</label>
                    <div className="value-with-copy">
                        <span className="value font-black">{accounts[method].name}</span>
                        <button onClick={() => navigator.clipboard.writeText(accounts[method].name)} title="Copy Title">
                            <i className="far fa-copy"></i>
                        </button>
                    </div>
                </div>

                <div className="detail-row">
                    <label>Account Number</label>
                    <div className="value-with-copy large">
                        <span className="value font-black">{accounts[method].number}</span>
                        <button onClick={() => navigator.clipboard.writeText(accounts[method].number)} title="Copy Number">
                            <i className="far fa-copy"></i>
                        </button>
                    </div>
                </div>

                <div className="amount-highlight">
                    <span className="label">Amount to Transfer</span>
                    <span className="amount font-black">Rs. {amount?.toLocaleString()}</span>
                </div>
            </div>

            <div className="upload-instructions">
                <h3>Steps to follow:</h3>
                <ol>
                    <li>Open your <strong>{method === 'easypaisa' ? 'EasyPaisa' : 'JazzCash'}</strong> app.</li>
                    <li>Transfer <strong>Rs. {amount?.toLocaleString()}</strong> to the account above.</li>
                    <li>Take a <strong>screenshot</strong> of the successful transaction.</li>
                    <li>Upload that screenshot below safely.</li>
                </ol>
            </div>

            <div className="upload-area" onClick={() => !uploading && fileInputRef.current?.click()}>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    hidden 
                    accept="image/*" 
                    onChange={handleFileChange} 
                />
                
                {preview ? (
                    <div className="preview-wrap">
                        <img src={preview} alt="Proof Preview" />
                        <div className="preview-overlay">
                            <span>Change Image</span>
                        </div>
                    </div>
                ) : (
                    <div className="upload-placeholder">
                        <div className="icon">📸</div>
                        <p>Click to upload your Receipt Screenshot</p>
                        <span>Max size: 5MB (JPG, PNG)</span>
                    </div>
                )}
            </div>

            {error && <div className="proof-error">{error}</div>}

            <div className="action-buttons">
                <button className="cancel-btn" onClick={onCancel} disabled={uploading}>
                    Go Back
                </button>
                <button 
                    className={`submit-btn ${!file || uploading ? 'disabled' : ''}`} 
                    onClick={handleSubmit}
                    disabled={!file || uploading}
                    style={{ background: accounts[method].color }}
                >
                    {uploading ? (
                        <><i className="fas fa-circle-notch fa-spin"></i> Processing...</>
                    ) : (
                        'Submit Verification'
                    )}
                </button>
            </div>

            <p className="privacy-note">
                <i className="fas fa-shield-alt"></i> Your data is encrypted and used only for payment verification.
            </p>
        </div>
    );
};

export default PaymentProofUpload;
