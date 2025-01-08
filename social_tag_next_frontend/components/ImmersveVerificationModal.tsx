import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

interface ImmersveVerificationModalProps {
    fundAddress: string;
    rewardAddress: string | null;
    onVerificationComplete: () => void;
    onClose: () => void;
}

const ImmersveVerificationModal: React.FC<ImmersveVerificationModalProps> = ({
    fundAddress,
    rewardAddress,
    onVerificationComplete,
    onClose
}) => {
    const [verificationStatus, setVerificationStatus] = useState('waiting'); // waiting, pending, success, failed
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
    
    useEffect(() => {
        if (verificationStatus === 'pending' && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
        if (timeLeft === 0) {
            setVerificationStatus('failed');
        }
    }, [timeLeft, verificationStatus]);

    const startVerification = () => {
        setVerificationStatus('pending');
    };

    // Modified to always succeed for testing
    const checkVerification = () => {
        setVerificationStatus('success');
        setTimeout(() => {
            onVerificationComplete();
        }, 1500); // Short delay to show success state
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
                <h2 className="text-xl font-bold">Verify Fund Ownership</h2>
                
                {verificationStatus === 'waiting' && (
                    <>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-gray-700">
                                <span className="text-yellow-600 font-semibold">Testing Mode:</span> Verification will automatically succeed when checking.
                                <br /><br />
                                Fund Address:<br/>
                                <code className="bg-gray-100 p-1 rounded text-sm break-all">
                                    {fundAddress}
                                </code>
                                <br/>
                                Reward Address:<br/>
                                <code className="bg-gray-100 p-1 rounded text-sm break-all">
                                    {rewardAddress}
                                </code>
                            </p>
                        </div>
                        <Button 
                            onClick={startVerification}
                            className="w-full bg-black text-white hover:bg-gray-800"
                        >
                            Start Verification
                        </Button>
                    </>
                )}

                {verificationStatus === 'pending' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="animate-spin" />
                            <span>Waiting for verification...</span>
                        </div>
                        <div className="text-center">Time remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
                        <Button
                            onClick={checkVerification}
                            className="w-full bg-black text-white hover:bg-gray-800"
                        >
                            Check Verification
                        </Button>
                    </div>
                )}

                {verificationStatus === 'success' && (
                    <div className="bg-green-50 border border-green-500 rounded-lg p-4">
                        <p className="text-green-700">
                            Verification successful! Completing registration...
                        </p>
                    </div>
                )}

                {verificationStatus === 'failed' && (
                    <>
                        <div className="bg-red-50 border border-red-500 rounded-lg p-4">
                            <p className="text-red-700">
                                Verification failed. Please try again.
                            </p>
                        </div>
                        <Button
                            onClick={() => {
                                setVerificationStatus('waiting');
                                setTimeLeft(180);
                            }}
                            className="w-full bg-black text-white hover:bg-gray-800"
                        >
                            Retry
                        </Button>
                    </>
                )}

                <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full"
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
};

export default ImmersveVerificationModal;