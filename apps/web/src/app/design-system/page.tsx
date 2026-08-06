'use client';

import * as React from 'react';
import { notFound } from 'next/navigation';
import { Button, Input, Badge, Card, CardHeader, CardTitle, CardContent, Modal, ModalTrigger, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem, TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Alert, AlertTitle, AlertDescription } from '@umrolink/ui';
import { Info, CheckCircle, AlertTriangle, XCircle, Bell } from 'lucide-react';

interface ColorSwatch {
  name: string;
  token: string;
  border?: boolean;
}

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const colors: Record<string, ColorSwatch[]> = {
    Brand: [
      { name: 'Primary', token: 'bg-primary' },
      { name: 'Primary Hover', token: 'bg-primary-hover' },
      { name: 'Secondary', token: 'bg-secondary' },
      { name: 'Accent', token: 'bg-accent' },
    ],
    Neutral: [
      { name: '50', token: 'bg-neutral-50', border: true },
      { name: '100', token: 'bg-neutral-100' },
      { name: '200', token: 'bg-neutral-200' },
      { name: '300', token: 'bg-neutral-300' },
      { name: '400', token: 'bg-neutral-400' },
      { name: '500', token: 'bg-neutral-500' },
      { name: '600', token: 'bg-neutral-600' },
      { name: '700', token: 'bg-neutral-700' },
      { name: '800', token: 'bg-neutral-800' },
      { name: '900', token: 'bg-neutral-900' },
      { name: 'Surface', token: 'bg-surface', border: true },
    ],
    Semantic: [
      { name: 'Success', token: 'bg-success' },
      { name: 'Warning', token: 'bg-warning' },
      { name: 'Danger', token: 'bg-danger' },
      { name: 'Info', token: 'bg-info' },
    ],
    'Status Booking': [
      { name: 'Lead', token: 'bg-lead' },
      { name: 'Booking', token: 'bg-info' },
      { name: 'DP Dikonfirmasi', token: 'bg-warning' },
      { name: 'Lunas', token: 'bg-success' },
      { name: 'Berangkat', token: 'bg-primary' },
      { name: 'Batal', token: 'bg-danger' },
    ],
    'Status Komisi': [
      { name: 'Pending', token: 'bg-warning' },
      { name: 'Siap Dibayar', token: 'bg-info' },
      { name: 'Dibayar', token: 'bg-success' },
      { name: 'Dibatalkan', token: 'bg-danger' },
    ],
    'Status Paket': [
      { name: 'Draft', token: 'bg-neutral-400' },
      { name: 'Open', token: 'bg-success' },
      { name: 'Full', token: 'bg-warning' },
      { name: 'Selesai', token: 'bg-primary' },
    ],
    'Status Agen': [
      { name: 'Menunggu Persetujuan', token: 'bg-warning' },
      { name: 'Aktif', token: 'bg-success' },
      { name: 'Nonaktif', token: 'bg-neutral-400' },
    ],
    'KPI Colors': [
      { name: 'KPI Booking', token: 'bg-kpi-booking' },
      { name: 'KPI Revenue', token: 'bg-kpi-revenue' },
      { name: 'KPI Commission', token: 'bg-kpi-commission' },
      { name: 'KPI Agent', token: 'bg-kpi-agent' },
      { name: 'KPI Travel', token: 'bg-kpi-travel' },
      { name: 'KPI Pilgrim', token: 'bg-kpi-pilgrim' },
    ],
    'Chart Palette': [
      { name: 'Chart 1', token: 'bg-chart-1' },
      { name: 'Chart 2', token: 'bg-chart-2' },
      { name: 'Chart 3', token: 'bg-chart-3' },
      { name: 'Chart 4', token: 'bg-chart-4' },
      { name: 'Chart 5', token: 'bg-chart-5' },
    ],
    'Tenant Brand Colors': [
      { name: 'Tenant Primary', token: 'bg-tenant-primary' },
      { name: 'Tenant Secondary', token: 'bg-tenant-secondary' },
      { name: 'Tenant Accent', token: 'bg-tenant-accent' },
    ]
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-16">
      <div>
        <h1 className="text-3xl font-bold mb-8">Design System</h1>
        <p className="text-neutral-500">Umrolink Design System Components and Colors.</p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold border-b border-neutral-200 pb-2 mb-6">Colors</h2>
        {Object.entries(colors).map(([category, items]) => (
          <div key={category} className="mb-8">
            <h3 className="text-xl font-medium mb-4">{category}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {items.map((c) => (
                <div key={c.name} className="flex flex-col space-y-2">
                  <div className={`h-16 rounded-md ${c.token} ${c.border ? 'border border-neutral-200' : ''}`} />
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-neutral-500">{c.token}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold border-b border-neutral-200 pb-2 mb-6">Components</h2>
        
        {/* Buttons */}
        <div className="mb-12">
          <h3 className="text-xl font-medium mb-4">Buttons</h3>
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <Button disabled>Disabled</Button>
            <Button loading>Loading</Button>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <Button size="sm">Small</Button>
            <Button size="default">Default Size</Button>
            <Button size="lg">Large Size</Button>
            <Button size="icon"><Bell className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Inputs */}
        <div className="mb-12 max-w-sm">
          <h3 className="text-xl font-medium mb-4">Inputs</h3>
          <div className="space-y-4">
            <Input label="Default Input" placeholder="Type here..." />
            <Input label="Disabled Input" placeholder="Disabled..." disabled />
            <Input label="Error Input" placeholder="Error..." error="This field is required." />
          </div>
        </div>

        {/* Badges */}
        <div className="mb-12">
          <h3 className="text-xl font-medium mb-4">Badges</h3>
          <div className="flex flex-wrap gap-4">
            <Badge>Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </div>

        {/* Alerts */}
        <div className="mb-12 max-w-2xl">
          <h3 className="text-xl font-medium mb-4">Alerts</h3>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Default Alert</AlertTitle>
              <AlertDescription>This is a default alert message.</AlertDescription>
            </Alert>
            <Alert variant="success">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Action completed successfully.</AlertDescription>
            </Alert>
            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertTitle>Info</AlertTitle>
              <AlertDescription>Here is some information.</AlertDescription>
            </Alert>
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>Please be careful with this action.</AlertDescription>
            </Alert>
            <Alert variant="danger">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Something went wrong.</AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Card */}
        <div className="mb-12 max-w-sm">
          <h3 className="text-xl font-medium mb-4">Card</h3>
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This is the content of the card. It looks nice.</p>
            </CardContent>
          </Card>
        </div>

        {/* Modal */}
        <div className="mb-12">
          <h3 className="text-xl font-medium mb-4">Modal</h3>
          <Modal>
            <ModalTrigger asChild>
              <Button>Open Modal</Button>
            </ModalTrigger>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Are you absolutely sure?</ModalTitle>
                <ModalDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove your data from our servers.
                </ModalDescription>
              </ModalHeader>
              <ModalFooter>
                <Button variant="outline">Cancel</Button>
                <Button variant="destructive">Delete</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>

        {/* Dropdown */}
        <div className="mb-12">
          <h3 className="text-xl font-medium mb-4">Dropdown Menu</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-danger focus:text-danger">Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tooltip */}
        <div className="mb-12">
          <h3 className="text-xl font-medium mb-4">Tooltip</h3>
          <TooltipProvider>
            <Tooltip content="Tooltip content text">
              <Button variant="outline">Hover me</Button>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Table */}
        <div className="mb-12">
          <h3 className="text-xl font-medium mb-4">Table</h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">INV001</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Credit Card</TableCell>
                  <TableCell className="text-right">$250.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">INV002</TableCell>
                  <TableCell>Pending</TableCell>
                  <TableCell>PayPal</TableCell>
                  <TableCell className="text-right">$150.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      </section>
    </div>
  );
}
