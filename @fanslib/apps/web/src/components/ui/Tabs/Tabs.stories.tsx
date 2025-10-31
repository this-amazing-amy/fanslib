import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabItem } from './Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs aria-label="Options">
      <TabItem key="tab1" title="Tab 1">
        <div className="p-4 bg-base-200 rounded">Content for Tab 1</div>
      </TabItem>
      <TabItem key="tab2" title="Tab 2">
        <div className="p-4 bg-base-200 rounded">Content for Tab 2</div>
      </TabItem>
      <TabItem key="tab3" title="Tab 3">
        <div className="p-4 bg-base-200 rounded">Content for Tab 3</div>
      </TabItem>
    </Tabs>
  ),
};

export const WithDefaultSelected: Story = {
  render: () => (
    <Tabs aria-label="Options" defaultSelectedKey="tab2">
      <TabItem key="tab1" title="Overview">
        <div className="p-4 bg-base-200 rounded">
          <h3 className="font-bold mb-2">Overview</h3>
          <p>Welcome to the overview section.</p>
        </div>
      </TabItem>
      <TabItem key="tab2" title="Details">
        <div className="p-4 bg-base-200 rounded">
          <h3 className="font-bold mb-2">Details</h3>
          <p>Here are the detailed information.</p>
        </div>
      </TabItem>
      <TabItem key="tab3" title="Settings">
        <div className="p-4 bg-base-200 rounded">
          <h3 className="font-bold mb-2">Settings</h3>
          <p>Configure your settings here.</p>
        </div>
      </TabItem>
    </Tabs>
  ),
};

export const RichContent: Story = {
  render: () => (
    <Tabs aria-label="Dashboard">
      <TabItem key="stats" title="Statistics">
        <div className="grid grid-cols-3 gap-4 p-4">
          <div className="stat bg-base-200 rounded shadow">
            <div className="stat-title">Total Views</div>
            <div className="stat-value">12,345</div>
          </div>
          <div className="stat bg-base-200 rounded shadow">
            <div className="stat-title">Likes</div>
            <div className="stat-value">4,567</div>
          </div>
          <div className="stat bg-base-200 rounded shadow">
            <div className="stat-title">Comments</div>
            <div className="stat-value">789</div>
          </div>
        </div>
      </TabItem>
      <TabItem key="activity" title="Activity">
        <div className="p-4">
          <ul className="space-y-2">
            <li className="p-3 bg-base-200 rounded">New comment on your post</li>
            <li className="p-3 bg-base-200 rounded">Your post was liked by 10 users</li>
            <li className="p-3 bg-base-200 rounded">New follower: @username</li>
          </ul>
        </div>
      </TabItem>
      <TabItem key="reports" title="Reports">
        <div className="p-4 bg-base-200 rounded">
          <p>No reports available at this time.</p>
        </div>
      </TabItem>
    </Tabs>
  ),
};

