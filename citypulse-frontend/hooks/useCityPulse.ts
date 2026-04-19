'use client'

import { format } from 'date-fns'
import { useEffect, useRef, useState } from 'react'

import type { Alarm, ChartPoint, SensorData } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'

function buildChartPoint(snapshot: Map<string, SensorData>, timestamp: string): ChartPoint {
  const values = Array.from(snapshot.values())
  const energyValues = values.filter((sensor) => sensor.sensorType === 'energy')
  const trafficValues = values.filter((sensor) => sensor.sensorType === 'traffic')

  const averageFor = (list: SensorData[]) =>
    list.length === 0
      ? 0
      : Number(
          (list.reduce((sum, sensor) => sum + Number(sensor.value), 0) / list.length).toFixed(2)
        )

  return {
    time: format(new Date(timestamp), 'HH:mm:ss'),
    timestamp,
    energy: averageFor(energyValues),
    traffic: averageFor(trafficValues),
  }
}

export function useCityPulse() {
  const [sensorMap, setSensorMap] = useState<Map<string, SensorData>>(new Map())
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [connected, setConnected] = useState(false)
  const [chartData, setChartData] = useState<ChartPoint[]>([])

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)

  function appendChart(snapshot: Map<string, SensorData>, timestamp: string) {
    setChartData((previous) => {
      const nextPoint = buildChartPoint(snapshot, timestamp)
      return [...previous.slice(-59), nextPoint]
    })
  }

  function hydrateSensors(readings: SensorData[]) {
    let nextSnapshot = new Map<string, SensorData>()

    setSensorMap((previous) => {
      nextSnapshot = new Map(previous)
      readings.forEach((reading) => {
        nextSnapshot.set(reading.sensorId, reading)
      })
      return nextSnapshot
    })

    if (readings.length > 0) {
      appendChart(nextSnapshot, readings[0]?.timestamp || new Date().toISOString())
    }
  }

  function hydrateAlarms(initialAlarms: Alarm[]) {
    setAlarms(
      [...initialAlarms]
        .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
        .slice(0, 20)
    )
  }

  function markAlarmResolved(alarmId: string) {
    setAlarms((previous) =>
      previous.map((alarm) => (alarm.alarmId === alarmId ? { ...alarm, resolved: true } : alarm))
    )
  }

  useEffect(() => {
    let disposed = false

    function scheduleReconnect() {
      if (disposed || reconnectTimerRef.current) {
        return
      }

      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null
        connect()
      }, 3000)
    }

    function connect() {
      if (disposed) {
        return
      }

      const socket = new WebSocket(WS_URL)
      socketRef.current = socket

      socket.onopen = () => {
        setConnected(true)
      }

      socket.onmessage = ({ data }) => {
        try {
          const message = JSON.parse(data as string)

          if (message.type === 'sensor_update') {
            let nextSnapshot = new Map<string, SensorData>()

            setSensorMap((previous) => {
              nextSnapshot = new Map(previous)
              nextSnapshot.set(message.sensorId, message as SensorData)
              return nextSnapshot
            })

            appendChart(nextSnapshot, message.timestamp)
            return
          }

          if (message.type === 'alarm') {
            setAlarms((previous) => [message as Alarm, ...previous].slice(0, 20))
          }
        } catch (error) {
          console.warn('WebSocket message parse warning:', error)
        }
      }

      socket.onclose = () => {
        setConnected(false)
        scheduleReconnect()
      }

      socket.onerror = () => {
        setConnected(false)
      }
    }

    connect()

    return () => {
      disposed = true
      setConnected(false)

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }

      socketRef.current?.close()
    }
  }, [])

  return {
    sensorMap,
    sensors: Array.from(sensorMap.values()).sort((left, right) =>
      left.sensorId.localeCompare(right.sensorId)
    ),
    alarms,
    connected,
    chartData,
    hydrateSensors,
    hydrateAlarms,
    markAlarmResolved,
  }
}

