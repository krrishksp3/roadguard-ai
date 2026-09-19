import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { RoadReport } from '../../../../shared/types';
import { Link } from 'react-router-dom';

// Fix for default Leaflet marker icon URLs in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored pin icons with distinct state visuals
const createPinIcon = (color: string, isHighRisk: boolean = false) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        position: relative;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${isHighRisk ? `<div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background-color: ${color}40; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
        ">
          <div style="width: 7px; height: 7px; background-color: white; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const pinColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#10b981',
};

interface LocationPickerProps {
  onSelect: (lat: number, lng: number) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

interface ReportsMapProps {
  reports?: RoadReport[];
  selectedLocation?: [number, number];
  onLocationSelect?: (lat: number, lng: number) => void;
  onReportSelect?: (report: RoadReport) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export const ReportsMap: React.FC<ReportsMapProps> = ({
  reports = [],
  selectedLocation,
  onLocationSelect,
  onReportSelect,
  center = [28.9845, 77.7064], // Meerut center coordinates
  zoom = 12,
  height = '540px',
}) => {
  return (
    <div style={{ height, width: '100%' }} className="relative rounded-3xl overflow-hidden shadow-card border border-slate-200">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {onLocationSelect && <LocationPicker onSelect={onLocationSelect} />}

        {/* Selected location marker (for Create Report pin drop) */}
        {selectedLocation && (
          <Marker position={selectedLocation} icon={createPinIcon('#0f766e', true)}>
            <Popup>
              <div className="text-xs p-1 font-sans">
                <p className="font-bold text-ink-950">Selected Incident Location</p>
                <p className="text-slate-500 font-mono text-[10px]">{selectedLocation[0].toFixed(5)}, {selectedLocation[1].toFixed(5)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Existing reports markers */}
        {reports.map((report) => {
          const color = pinColors[report.severity.toLowerCase()] || '#0f766e';
          const isHigh = report.riskScore >= 70 || report.severity === 'critical' || report.severity === 'high';
          const priorityLabel =
            report.riskScore >= 75 ? 'High Priority' : report.riskScore >= 45 ? 'Medium Priority' : 'Low Priority';

          return (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={createPinIcon(color, isHigh)}
              eventHandlers={{
                click: () => {
                  if (onReportSelect) {
                    onReportSelect(report);
                  }
                },
              }}
            >
              <Popup>
                <div className="max-w-[240px] text-xs space-y-2 p-1 font-sans">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-mono font-bold text-ink-950">{report.id}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {report.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-ink-950 text-xs block capitalize">
                      {report.damageType.replace(/_/g, ' ')}
                    </span>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {report.address || 'Meerut Road Network'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-100">
                    <span>
                      Priority: <strong>{report.riskScore}/100</strong> ({priorityLabel})
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400">
                    Updated: {new Date(report.updatedAt).toLocaleDateString()}
                  </div>

                  <Link
                    to={`/reports/${report.id}`}
                    className="block text-center bg-teal-700 hover:bg-teal-600 text-white py-1.5 px-3 rounded-xl font-bold text-[11px] transition mt-1"
                  >
                    View Report
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
