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

// Custom colored pin icons
const createPinIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const pinColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
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
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export const ReportsMap: React.FC<ReportsMapProps> = ({
  reports = [],
  selectedLocation,
  onLocationSelect,
  center = [28.9845, 77.7064], // Meerut center coordinates
  zoom = 12,
  height = '500px',
}) => {
  return (
    <div style={{ height, width: '100%' }} className="relative rounded-xl overflow-hidden shadow-sm border border-slate-200">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {onLocationSelect && <LocationPicker onSelect={onLocationSelect} />}

        {/* Selected location marker (for Create Report pin drop) */}
        {selectedLocation && (
          <Marker position={selectedLocation} icon={createPinIcon('#0284c7')}>
            <Popup>
              <div className="text-xs p-1">
                <p className="font-bold text-slate-900">Selected Incident Location</p>
                <p className="text-slate-500">{selectedLocation[0].toFixed(5)}, {selectedLocation[1].toFixed(5)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Existing reports markers */}
        {reports.map((report) => {
          const color = pinColors[report.severity.toLowerCase()] || '#0284c7';
          return (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={createPinIcon(color)}
            >
              <Popup>
                <div className="max-w-[220px] text-xs space-y-1.5 p-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{report.id}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase" style={{ backgroundColor: `${color}20`, color }}>
                      {report.severity}
                    </span>
                  </div>
                  <p className="font-medium text-slate-800 line-clamp-2">{report.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>Risk: <strong>{report.riskScore}/100</strong></span>
                    <span>Status: <strong>{report.status}</strong></span>
                  </div>
                  <Link
                    to={`/reports/${report.id}`}
                    className="block text-center bg-gov-700 hover:bg-gov-800 text-white py-1 px-2 rounded font-medium text-[11px] mt-1 transition"
                  >
                    View Complaint
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
