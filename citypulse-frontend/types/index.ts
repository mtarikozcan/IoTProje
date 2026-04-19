export interface SensorData {
  sensorId: string
  sensorType: 'energy' | 'traffic'
  value: number
  unit: string
  location: string
  lat: number
  lng: number
  status: 'normal' | 'warning' | 'critical'
  average5m: number
  timestamp: string
}

export interface Alarm {
  alarmId: string
  sensorId: string
  sensorType: string
  value: number
  average5m: number
  deviation: number
  severity: 'warning' | 'critical'
  message: string
  resolved: boolean
  timestamp: string
  location?: string
}

export interface ChartPoint {
  time: string
  timestamp: string
  energy: number
  traffic: number
}

export interface DashboardSummary {
  activeSensors: number
  readingsLastHour: number
  activeAlarms: number
  systemStatus: 'healthy' | 'warning'
}

