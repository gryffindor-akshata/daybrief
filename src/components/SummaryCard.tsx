'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface SummaryCardProps {
  summary: string
  actionItems: string[]
  confidence: number
  finalized: boolean
}

export function SummaryCard({ 
  summary, 
  actionItems, 
  confidence, 
  finalized 
}: SummaryCardProps) {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({})

  const toggleActionItem = (index: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-3 w-3" />
    if (confidence >= 0.6) return <Clock className="h-3 w-3" />
    return <AlertCircle className="h-3 w-3" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-muted-foreground">Summary</h4>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-xs ${getConfidenceColor(confidence)}`}>
            {getConfidenceIcon(confidence)}
            {Math.round(confidence * 100)}% confidence
          </div>
          {finalized && (
            <Badge variant="secondary" className="text-xs">
              Finalized
            </Badge>
          )}
        </div>
      </div>

      <div className="prose prose-sm max-w-none">
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {summary.split('\n').map((line, index) => (
            <div key={index}>
              {line.startsWith('- ') ? (
                <ul className="list-disc ml-4">
                  <li>{line.substring(2)}</li>
                </ul>
              ) : (
                line
              )}
            </div>
          ))}
        </div>
      </div>

      {actionItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">
            Action Items ({actionItems.length})
          </h4>
          <div className="space-y-2">
            {actionItems.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <Checkbox
                  id={`action-${index}`}
                  checked={checkedItems[index] || false}
                  onCheckedChange={() => toggleActionItem(index)}
                  className="mt-0.5"
                />
                <label 
                  htmlFor={`action-${index}`}
                  className={`text-sm leading-relaxed cursor-pointer ${
                    checkedItems[index] ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {item}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
