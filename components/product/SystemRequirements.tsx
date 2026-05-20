'use client';

import { motion } from 'framer-motion';
import { Monitor, Cpu, HardDrive, Database, Info } from 'lucide-react';
import type { SystemRequirementsData } from '@/lib/types';

interface SystemRequirementsProps {
  requirements: SystemRequirementsData;
}

const FIELDS: { key: keyof Omit<SystemRequirementsData['minimum'], 'notes'>; label: string; icon: React.ElementType }[] = [
  { key: 'os',      label: 'ОС',       icon: Monitor   },
  { key: 'cpu',     label: 'Процессор',icon: Cpu       },
  { key: 'gpu',     label: 'Видеокарта',icon: Monitor  },
  { key: 'ram',     label: 'ОЗУ',      icon: Database },
  { key: 'storage', label: 'Диск',     icon: HardDrive  },
  { key: 'directx', label: 'DirectX',  icon: Monitor    },
];

function ReqColumn({
  title, spec, color, delay,
}: {
  title: string;
  spec: SystemRequirementsData['minimum'];
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: '#0D0D16', border: `1px solid ${color}22` }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center gap-2"
        style={{ background: `${color}08`, borderBottom: `1px solid ${color}18` }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
        />
        <span className="font-heading font-bold text-white" style={{ fontSize: '13px' }}>{title}</span>
      </div>

      {/* Fields */}
      <div className="p-4 space-y-3">
        {FIELDS.map(({ key, label, icon: Icon }) => {
          const val = spec[key];
          if (!val) return null;
          return (
            <div key={key} className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${color}0E`, border: `1px solid ${color}1A` }}
              >
                <Icon style={{ width: '12px', height: '12px', color: color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-[#374151] mb-0.5" style={{ fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {label}
                </p>
                <p className="font-body text-[#C4B5FD]" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  {val}
                </p>
              </div>
            </div>
          );
        })}

        {/* Notes */}
        {spec.notes && (
          <div
            className="flex items-start gap-2 rounded-xl p-3 mt-2"
            style={{ background: `${color}06`, border: `1px solid ${color}18` }}
          >
            <Info style={{ width: '12px', height: '12px', color: color, flexShrink: 0, marginTop: '1px' }} />
            <p className="font-body text-[#6B7280]" style={{ fontSize: '11px', lineHeight: '1.5' }}>
              {spec.notes}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function SystemRequirements({ requirements }: SystemRequirementsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1" style={{ background: 'rgba(6,182,212,0.15)' }} />
        <p className="font-pixel" style={{ fontSize: '9px', color: '#06B6D4', letterSpacing: '0.14em' }}>
          СИСТЕМНЫЕ ТРЕБОВАНИЯ
        </p>
        <div className="h-px flex-1" style={{ background: 'rgba(6,182,212,0.15)' }} />
      </div>
      <h2 className="font-heading font-bold text-white text-xl sm:text-2xl mb-6">
        Требования для ПК
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <ReqColumn
          title="Минимальные"
          spec={requirements.minimum}
          color="#4B5563"
          delay={0}
        />
        <ReqColumn
          title="Рекомендуемые"
          spec={requirements.recommended}
          color="#06B6D4"
          delay={0.1}
        />
      </div>
    </motion.section>
  );
}
