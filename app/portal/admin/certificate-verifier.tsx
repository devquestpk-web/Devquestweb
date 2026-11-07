"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, FileImage, LoaderCircle, Search, ShieldAlert } from "lucide-react";
import type { IScannerControls } from "@zxing/browser";
import { certificateCodeFromInput } from "../../lib/certificate-code";

type CertificateDetails = {
  certCode: string;
  studentName: string;
  itemType: string;
  itemTitle?: string | null;
  instructorName?: string | null;
  issuedAt: string;
};

type VerificationResult =
  | { status: "valid"; certificate: CertificateDetails }
  | { status: "invalid" | "revoked" | "error"; message: string };

export function CertificateVerifier() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const scanIdRef = useRef(0);
  const requestIdRef = useRef(0);
  const [input, setInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const stopCamera = useCallback(() => {
    scanIdRef.current += 1;
    controlsRef.current?.stop();
    controlsRef.current = null;
    const video = videoRef.current;
    if (typeof MediaStream !== "undefined" && video?.srcObject instanceof MediaStream) {
      video.srcObject.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => () => {
    scanIdRef.current += 1;
    controlsRef.current?.stop();
    const video = videoRef.current;
    if (typeof MediaStream !== "undefined" && video?.srcObject instanceof MediaStream) video.srcObject.getTracks().forEach((track) => track.stop());
  }, []);

  const verify = useCallback(async (rawValue: string) => {
    const code = certificateCodeFromInput(rawValue, window.location.origin);
    if (!code) {
      setResult({ status: "error", message: "Enter a certificate ID or scan a DevQuest verification QR code." });
      return;
    }

    const requestId = ++requestIdRef.current;
    setInput(code);
    setChecking(true);
    setResult(null);
    try {
      const response = await fetch(`/api/verify/${encodeURIComponent(code)}`, { cache: "no-store" });
      const body = await response.json();
      if (requestId !== requestIdRef.current) return;
      if (response.ok && body.verified && body.certificate) {
        setResult({ status: "valid", certificate: body.certificate as CertificateDetails });
      } else if (response.status === 410) {
        setResult({ status: "revoked", message: "This certificate was revoked and is no longer valid." });
      } else if (response.status === 404) {
        setResult({ status: "invalid", message: "No issued certificate matches this ID." });
      } else {
        setResult({ status: "error", message: body.error || "Verification is temporarily unavailable." });
      }
    } catch {
      if (requestId === requestIdRef.current) setResult({ status: "error", message: "Could not reach the verification service. Try again." });
    } finally {
      if (requestId === requestIdRef.current) setChecking(false);
    }
  }, []);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      setResult({ status: "error", message: "Camera scanning needs a secure browser connection. Upload a QR image or enter the certificate ID instead." });
      return;
    }

    stopCamera();
    const scanId = ++scanIdRef.current;
    setResult(null);
    setScanning(true);
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      if (scanId !== scanIdRef.current || !videoRef.current) return;
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        videoRef.current,
        (scan, _error, activeControls) => {
          if (!scan || scanId !== scanIdRef.current) return;
          const value = scan.getText();
          activeControls.stop();
          stopCamera();
          void verify(value);
        },
      );
      if (scanId !== scanIdRef.current) controls.stop();
      else controlsRef.current = controls;
    } catch {
      if (scanId === scanIdRef.current) {
        stopCamera();
        setResult({ status: "error", message: "Camera access was unavailable. Allow camera access, upload a QR image, or enter the certificate ID." });
      }
    }
  }

  async function scanImage(file: File | undefined) {
    if (!file) return;
    stopCamera();
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      setResult({ status: "error", message: "Choose a QR image smaller than 10 MB." });
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setResult(null);
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const scan = await new BrowserQRCodeReader().decodeFromImageUrl(objectUrl);
      await verify(scan.getText());
    } catch {
      setResult({ status: "error", message: "No readable QR code was found in that image." });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    stopCamera();
    void verify(input);
  }

  return <section className="portal-panel certificate-verifier">
    <div className="portal-panel-head"><div><p>CERTIFICATE VERIFICATION</p><h2>Scan or check a certificate</h2></div></div>
    <p className="certificate-verifier-intro">Scan the QR code on a DevQuest certificate, upload its QR image, or enter the certificate ID. The result is checked against the issued certificate record.</p>
    <div className="certificate-verifier-grid">
      <div className="certificate-verifier-controls">
        <form onSubmit={submit} className="certificate-verifier-form">
          <label htmlFor="certificate-code">Certificate ID or verification link</label>
          <div><input id="certificate-code" value={input} onChange={(event) => setInput(event.target.value)} placeholder="DQ-CERT-2026-..." autoComplete="off" /><button className="portal-primary" type="submit" disabled={checking}>{checking ? <LoaderCircle className="spin" /> : <Search />} Verify</button></div>
        </form>
        <div className="certificate-verifier-actions">
          <button type="button" className="portal-mini-action" onClick={scanning ? stopCamera : () => void startCamera()}>{scanning ? <CameraOff /> : <Camera />}{scanning ? "Stop camera" : "Scan with camera"}</button>
          <label className="portal-mini-action certificate-image-upload"><FileImage /> Upload QR image<input type="file" accept="image/*" onChange={(event) => { void scanImage(event.target.files?.[0]); event.target.value = ""; }} /></label>
        </div>
      </div>
      <div className="certificate-scan-preview">
        <video ref={videoRef} autoPlay muted playsInline hidden={!scanning} aria-label="Certificate QR camera preview" />
        {!scanning && <div><Camera aria-hidden="true" /><span>Camera preview appears here</span></div>}
      </div>
    </div>
    {result && <div className={`certificate-verification-result ${result.status}`} role="status" aria-live="polite">
      {result.status === "valid" ? <><CheckCircle2 aria-hidden="true" /><div><strong>Verified certificate</strong><p><b>{result.certificate.studentName}</b> · {result.certificate.itemTitle || result.certificate.itemType}</p><small>ID: {result.certificate.certCode} · Issued {new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(new Date(result.certificate.issuedAt))}</small><a href={`/verify/${encodeURIComponent(result.certificate.certCode)}`} target="_blank" rel="noopener noreferrer">Open verification page</a></div></> : <><ShieldAlert aria-hidden="true" /><div><strong>{result.status === "revoked" ? "Revoked certificate" : result.status === "invalid" ? "Certificate not found" : "Verification unavailable"}</strong><p>{result.message}</p></div></>}
    </div>}
  </section>;
}
