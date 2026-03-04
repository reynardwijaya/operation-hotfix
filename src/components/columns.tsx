'use client'

import { updateShipmentStatus } from '@/actions/update-status'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'

export type Shipment = {
  id: string
  created_at: string
  status: string
  cargo_details: {
    item: string
    weight_kg: number
  }
}

export const columns: ColumnDef<Shipment>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <span className='font-mono text-xs text-muted-foreground'>
        {row.getValue<string>('id').slice(0, 8)}…
      </span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => {
      const date = new Date(row.getValue<string>('created_at'))
      return <span className='text-sm'>{date.toLocaleDateString()}</span>
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
  },
  {
    accessorKey: 'cargo_details',
    header: 'Cargo',
    cell: ({ row }) => {
      const cargo = row.getValue<Shipment['cargo_details']>('cargo_details')
      return (
        <div className='text-sm'>
          <p className='font-medium'>{cargo.item}</p>
          <p className='text-muted-foreground'>{cargo.weight_kg} kg</p>
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const shipment = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Update Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => updateShipmentStatus(shipment.id, 'Pending')}
            >
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateShipmentStatus(shipment.id, 'In Transit')}
            >
              In Transit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateShipmentStatus(shipment.id, 'Delivered')}
            >
              Delivered
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
