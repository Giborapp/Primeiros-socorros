import React, { useState } from 'react';
import { useRive } from '@rive-app/react-canvas';

function RiveViewer({ src, label }) {
  const [info, setInfo] = useState(null);

  const { RiveComponent, rive } = useRive({
    src,
    autoplay: true,
    onLoad: () => {
      if (!rive) return;
      const sms = rive.stateMachineNames || [];
      const data = { stateMachines: sms, inputs: {} };
      sms.forEach(sm => {
        try {
          const inputs = rive.stateMachineInputs(sm);
          data.inputs[sm] = inputs?.map(i => ({
            name: i.name,
            type: i.type,
          }));
        } catch {}
      });
      setInfo(data);
    },
  });

  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, marginBottom: 24 }}>
      <h3 style={{ marginBottom: 12, color: '#fdcb6e' }}>{label}</h3>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: 200, height: 200, borderRadius: 16, overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
          <RiveComponent />
        </div>
        <div style={{ flex: 1, fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>
          {info ? (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(info, null, 2)}
            </pre>
          ) : (
            <div>Carregando...</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RivePreviewScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#0f0c29,#302b63)',
      padding: 24,
    }}>
      <h1 style={{ marginBottom: 24, fontSize: '1.4rem' }}>🎭 Rive Preview & State Machines</h1>
      <RiveViewer src="/mascot.riv"   label="mascot.riv" />
      <RiveViewer src="/explorer.riv" label="explorer.riv" />
    </div>
  );
}
