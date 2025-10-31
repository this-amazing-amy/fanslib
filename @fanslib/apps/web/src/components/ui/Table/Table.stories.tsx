import type { Meta, StoryObj } from '@storybook/react';
import { Cell, Column, Row, TableBody, TableHeader } from 'react-stately';
import { Badge } from '../Badge';
import { Table } from './Table';

const meta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: () => (
    <Table aria-label="Example table">
      <TableHeader>
        <Column>Name</Column>
        <Column>Email</Column>
        <Column>Role</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>John Doe</Cell>
          <Cell>john@example.com</Cell>
          <Cell>Admin</Cell>
        </Row>
        <Row>
          <Cell>Jane Smith</Cell>
          <Cell>jane@example.com</Cell>
          <Cell>User</Cell>
        </Row>
        <Row>
          <Cell>Bob Johnson</Cell>
          <Cell>bob@example.com</Cell>
          <Cell>Moderator</Cell>
        </Row>
      </TableBody>
    </Table>
  ),
};

export const Zebra: Story = {
  render: () => (
    <Table aria-label="Zebra striped table" zebra>
      <TableHeader>
        <Column>ID</Column>
        <Column>Product</Column>
        <Column>Price</Column>
        <Column>Stock</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>1</Cell>
          <Cell>Widget A</Cell>
          <Cell>$19.99</Cell>
          <Cell>150</Cell>
        </Row>
        <Row>
          <Cell>2</Cell>
          <Cell>Gadget B</Cell>
          <Cell>$29.99</Cell>
          <Cell>75</Cell>
        </Row>
        <Row>
          <Cell>3</Cell>
          <Cell>Device C</Cell>
          <Cell>$39.99</Cell>
          <Cell>200</Cell>
        </Row>
        <Row>
          <Cell>4</Cell>
          <Cell>Tool D</Cell>
          <Cell>$49.99</Cell>
          <Cell>50</Cell>
        </Row>
      </TableBody>
    </Table>
  ),
};

export const Compact: Story = {
  render: () => (
    <Table aria-label="Compact table" compact>
      <TableHeader>
        <Column>Name</Column>
        <Column>Status</Column>
        <Column>Date</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>Task 1</Cell>
          <Cell>Completed</Cell>
          <Cell>2024-01-15</Cell>
        </Row>
        <Row>
          <Cell>Task 2</Cell>
          <Cell>In Progress</Cell>
          <Cell>2024-01-16</Cell>
        </Row>
        <Row>
          <Cell>Task 3</Cell>
          <Cell>Pending</Cell>
          <Cell>2024-01-17</Cell>
        </Row>
      </TableBody>
    </Table>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <Table aria-label="Users table" zebra>
      <TableHeader>
        <Column>User</Column>
        <Column>Email</Column>
        <Column>Status</Column>
        <Column>Role</Column>
      </TableHeader>
      <TableBody>
        <Row>
          <Cell>Alice Cooper</Cell>
          <Cell>alice@example.com</Cell>
          <Cell>
            <Badge variant="success">Active</Badge>
          </Cell>
          <Cell>
            <Badge variant="primary">Admin</Badge>
          </Cell>
        </Row>
        <Row>
          <Cell>Bob Wilson</Cell>
          <Cell>bob@example.com</Cell>
          <Cell>
            <Badge variant="warning">Away</Badge>
          </Cell>
          <Cell>
            <Badge variant="secondary">User</Badge>
          </Cell>
        </Row>
        <Row>
          <Cell>Charlie Brown</Cell>
          <Cell>charlie@example.com</Cell>
          <Cell>
            <Badge variant="error">Offline</Badge>
          </Cell>
          <Cell>
            <Badge variant="accent">Moderator</Badge>
          </Cell>
        </Row>
      </TableBody>
    </Table>
  ),
};

export const Empty: Story = {
  render: () => (
    <Table aria-label="Empty table">
      <TableHeader>
        <Column>Name</Column>
        <Column>Email</Column>
        <Column>Status</Column>
      </TableHeader>
      <TableBody>
        {[]}
      </TableBody>
    </Table>
  ),
};

