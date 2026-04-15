/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { webui, type IWebUIStatus } from '@/common/adapter/ipcBridge';
import AionModal from '@/renderer/components/base/AionModal';
import AionScrollArea from '@/renderer/components/base/AionScrollArea';
import ChannelDingTalkLogo from '@/renderer/assets/channel-logos/dingtalk.svg';
import ChannelDiscordLogo from '@/renderer/assets/channel-logos/discord.svg';
import ChannelLarkLogo from '@/renderer/assets/channel-logos/lark.svg';
import ChannelSlackLogo from '@/renderer/assets/channel-logos/slack.svg';
import ChannelTelegramLogo from '@/renderer/assets/channel-logos/telegram.svg';
import ChannelWecomLogo from '@/renderer/assets/channel-logos/wecom.svg';
import ChannelWeixinLogo from '@/renderer/assets/channel-logos/weixin.svg';
import { Button, Form, Input, Message, Tabs } from '@arco-design/web-react';
import { CheckOne, Communication, Copy, EditTwo, Refresh } from '@icon-park/react';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsViewMode } from '../settingsViewContext';

const ChannelModalContentLazy = React.lazy(() => import('./channels/ChannelModalContent'));
const QRCodeSVGLazy = React.lazy(async () => {
  const mod = await import('qrcode.react');
  return { default: mod.QRCodeSVG };
});

const CHANNEL_LOGOS = [
  { src: ChannelTelegramLogo, alt: 'Telegram' },
  { src: ChannelLarkLogo, alt: 'Lark' },
  { src: ChannelDingTalkLogo, alt: 'DingTalk' },
  { src: ChannelWeixinLogo, alt: 'WeChat' },
  { src: ChannelWecomLogo, alt: 'WeCom' },
  { src: ChannelSlackLogo, alt: 'Slack' },
  { src: ChannelDiscordLogo, alt: 'Discord' },
] as const;

const Row: React.FC<{ label: string; description?: React.ReactNode; value: React.ReactNode; action?: React.ReactNode }> = ({
  label,
  description,
  value,
  action,
}) => (
  <div className='flex items-start justify-between gap-16px py-12px border-b border-b-solid border-b-[var(--color-border-2)] last:border-b-none'>
    <div className='flex-1 min-w-0'>
      <div className='text-14px text-t-primary'>{label}</div>
      {description && <div className='text-12px text-t-tertiary mt-4px'>{description}</div>}
      <div className='text-13px text-t-secondary mt-6px break-all'>{value}</div>
    </div>
    {action && <div className='shrink-0'>{action}</div>}
  </div>
);

const StatusBadge: React.FC<{ running: boolean }> = ({ running }) => (
  <span
    className='inline-flex items-center gap-6px px-10px py-4px rd-999px text-12px font-500'
    style={{
      background: running ? 'rgba(var(--success-6), 0.12)' : 'rgba(var(--warning-6), 0.12)',
      color: running ? 'rgb(var(--success-6))' : 'rgb(var(--warning-6))',
    }}
  >
    <CheckOne theme='outline' size='12' />
    {running ? 'Running' : 'Unavailable'}
  </span>
);

const PasswordModal: React.FC<{
  visible: boolean;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: { newPassword: string; confirmPassword: string }) => Promise<void>;
}> = ({ visible, loading, onCancel, onSubmit }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  return (
    <AionModal visible={visible} onCancel={onCancel} footer={null} title={t('settings.webui.changePassword')} size='small'>
      <Form
        form={form}
        layout='vertical'
        onSubmit={(values) => void onSubmit(values as { newPassword: string; confirmPassword: string })}
      >
        <Form.Item
          field='newPassword'
          label={t('settings.webui.newPassword')}
          rules={[
            { required: true, message: t('settings.webui.newPasswordRequired') },
            {
              validator: (value, cb) => {
                if (typeof value === 'string' && value.length >= 8 && value.length <= 128) {
                  cb();
                  return;
                }
                cb(t('settings.webui.passwordMinLength'));
              },
            },
          ]}
        >
          <Input.Password placeholder={t('settings.webui.newPasswordPlaceholder')} />
        </Form.Item>
        <Form.Item
          field='confirmPassword'
          label={t('settings.webui.confirmPassword')}
          rules={[
            { required: true, message: t('settings.webui.confirmPasswordRequired') },
            {
              validator: (value, cb) => {
                if (value === form.getFieldValue('newPassword')) {
                  cb();
                  return;
                }
                cb(t('settings.webui.passwordMismatch'));
              },
            },
          ]}
        >
          <Input.Password placeholder={t('settings.webui.confirmPasswordPlaceholder')} />
        </Form.Item>
        <div className='flex justify-end gap-8px mt-16px'>
          <Button onClick={onCancel}>{t('common.cancel')}</Button>
          <Button type='primary' loading={loading} onClick={() => form.submit()}>
            {t('common.confirm')}
          </Button>
        </div>
      </Form>
    </AionModal>
  );
};

const UsernameModal: React.FC<{
  visible: boolean;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: { newUsername: string }) => Promise<void>;
  currentUsername: string;
}> = ({ visible, loading, onCancel, onSubmit, currentUsername }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({ newUsername: currentUsername });
    }
  }, [currentUsername, form, visible]);

  return (
    <AionModal visible={visible} onCancel={onCancel} footer={null} title={t('settings.webui.setNewUsername')} size='small'>
      <Form form={form} layout='vertical' onSubmit={(values) => void onSubmit(values as { newUsername: string })}>
        <Form.Item field='newUsername' label={t('settings.webui.username')} rules={[{ required: true }]}> 
          <Input placeholder={t('settings.webui.newUsernamePlaceholder')} maxLength={64} />
        </Form.Item>
        <div className='flex justify-end gap-8px mt-16px'>
          <Button onClick={onCancel}>{t('common.cancel')}</Button>
          <Button type='primary' loading={loading} onClick={() => form.submit()}>
            {t('common.confirm')}
          </Button>
        </div>
      </Form>
    </AionModal>
  );
};

const WebuiModalContent: React.FC = () => {
  const { t } = useTranslation();
  const viewMode = useSettingsViewMode();
  const isPageMode = viewMode === 'page';
  const [activeTab, setActiveTab] = useState<'access' | 'channels'>('access');
  const [status, setStatus] = useState<IWebUIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrData, setQrData] = useState<{ qrUrl: string; expiresAt: number } | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const result = await webui.getStatus.invoke();
      if (result.success && result.data) {
        setStatus(result.data);
      } else {
        Message.error(result.msg || t('settings.webui.operationFailed'));
      }
    } catch (error) {
      console.error('[WebuiModal] Failed to load status:', error);
      Message.error(t('settings.webui.operationFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const urls = useMemo(
    () => [
      status?.localUrl ? { label: t('settings.webui.localUrl'), value: status.localUrl } : null,
      status?.networkUrl ? { label: t('settings.webui.networkUrl'), value: status.networkUrl } : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>,
    [status?.localUrl, status?.networkUrl, t]
  );

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    Message.success(t('common.copySuccess', { defaultValue: 'Copied' }));
  };

  const handlePasswordSubmit = async (values: { newPassword: string; confirmPassword: string }) => {
    setPasswordLoading(true);
    try {
      const result = await webui.changePassword.invoke({ newPassword: values.newPassword });
      if (!result.success) {
        Message.error(result.msg || t('settings.webui.passwordChangeFailed'));
        return;
      }
      setPasswordModalVisible(false);
      Message.success(t('settings.webui.passwordChanged'));
      await loadStatus();
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUsernameSubmit = async (values: { newUsername: string }) => {
    setUsernameLoading(true);
    try {
      const result = await webui.changeUsername.invoke({ newUsername: values.newUsername.trim() });
      if (!result.success) {
        Message.error(result.msg || t('settings.webui.usernameChangeFailed'));
        return;
      }
      setUsernameModalVisible(false);
      Message.success(t('settings.webui.usernameChanged'));
      await loadStatus();
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetLoading(true);
    try {
      const result = await webui.resetPassword.invoke();
      if (!result.success || !result.data?.newPassword) {
        Message.error(result.msg || t('settings.webui.passwordResetFailed'));
        return;
      }
      Message.success(t('settings.webui.passwordResetSuccess'));
      setStatus((prev) => (prev ? { ...prev, initialPassword: result.data?.newPassword } : prev));
    } finally {
      setResetLoading(false);
    }
  };

  const handleGenerateQr = async () => {
    setQrLoading(true);
    try {
      const result = await webui.generateQRToken.invoke();
      if (!result.success || !result.data) {
        Message.error(result.msg || t('settings.webui.qrGenerateFailed'));
        return;
      }
      setQrData({ qrUrl: result.data.qrUrl, expiresAt: result.data.expiresAt });
    } finally {
      setQrLoading(false);
    }
  };

  const accessContent = (
    <div className='flex flex-col gap-24px'>
      <div className='rounded-xl bg-fill-2 p-20px'>
        <div className='flex items-center justify-between gap-12px mb-8px'>
          <div className='text-16px font-500 text-t-primary'>{t('settings.webui')}</div>
          <StatusBadge running={status?.running ?? false} />
        </div>
        <div className='text-13px text-t-secondary'>{t('settings.webui.description')}</div>
        <div className='mt-12px flex items-center gap-8px'>
          {CHANNEL_LOGOS.map((item) => (
            <img key={item.alt} src={item.src} alt={item.alt} className='h-20px w-20px object-contain opacity-80' />
          ))}
          <span className='text-12px text-t-secondary'>{t('settings.webui.featureChannelsDesc')}</span>
        </div>
      </div>

      <div className='rounded-xl bg-fill-1 px-20px'>
        <Row label={t('settings.webui.port')} value={status?.port ?? '--'} />
        <Row
          label={t('settings.webui.allowRemote')}
          description={t('settings.webui.allowRemoteDesc')}
          value={status?.allowRemote ? 'true' : 'false'}
        />
        {urls.map((item) => (
          <Row
            key={item.label}
            label={item.label}
            value={item.value}
            action={
              <Button type='secondary' size='mini' icon={<Copy theme='outline' size='12' />} onClick={() => void copy(item.value)} />
            }
          />
        ))}
      </div>

      <div className='rounded-xl bg-fill-1 px-20px'>
        <Row
          label={t('settings.webui.username')}
          value={status?.adminUsername || 'admin'}
          action={<Button size='mini' type='secondary' icon={<EditTwo theme='outline' size='12' />} onClick={() => setUsernameModalVisible(true)} />}
        />
        <Row
          label={t('settings.webui.initialPassword')}
          description={t('settings.webui.passwordOnlyFirstTime')}
          value={status?.initialPassword || t('settings.webui.passwordHidden')}
          action={
            status?.initialPassword ? (
              <Button type='secondary' size='mini' icon={<Copy theme='outline' size='12' />} onClick={() => void copy(status.initialPassword!)} />
            ) : undefined
          }
        />
        <Row
          label={t('settings.webui.changePassword')}
          value={t('settings.webui.resetPasswordHint')}
          action={<Button size='mini' type='secondary' onClick={() => setPasswordModalVisible(true)}>{t('settings.webui.changePassword')}</Button>}
        />
        <Row
          label={t('settings.webui.resetPassword')}
          description={t('settings.webui.resetPasswordWarning')}
          value={t('settings.webui.resetPasswordHint')}
          action={<Button size='mini' status='warning' loading={resetLoading} onClick={() => void handleResetPassword()}>{t('settings.webui.resetPassword')}</Button>}
        />
      </div>

      <div className='rounded-xl bg-fill-1 px-20px py-16px'>
        <div className='flex items-center justify-between gap-12px mb-12px'>
          <div>
            <div className='text-14px text-t-primary'>{t('settings.webui.qrLoginTitle')}</div>
            <div className='text-12px text-t-secondary mt-4px'>{t('settings.webui.qrLoginHint')}</div>
          </div>
          <Button type='secondary' icon={<Refresh theme='outline' size='14' />} loading={qrLoading} onClick={() => void handleGenerateQr()}>
            {t('settings.webui.refreshQr')}
          </Button>
        </div>
        {qrData ? (
          <div className='flex flex-col items-center gap-12px py-8px'>
            <Suspense fallback={<div className='h-180px w-180px bg-fill-2 rounded-lg' />}>
              <QRCodeSVGLazy value={qrData.qrUrl} size={180} includeMargin />
            </Suspense>
            <div className='text-12px text-t-secondary'>{t('settings.webui.qrExpires', { time: new Date(qrData.expiresAt).toLocaleTimeString() })}</div>
            <Button type='secondary' size='mini' icon={<Communication theme='outline' size='12' />} onClick={() => void copy(qrData.qrUrl)}>
              {t('settings.webui.copyQrLink')}
            </Button>
          </div>
        ) : (
          <div className='text-12px text-t-secondary py-8px'>{t('settings.webui.qrLogin')}</div>
        )}
      </div>
    </div>
  );

  const channelsContent = (
    <Suspense fallback={<div className='p-24px text-t-secondary'>{t('common.loading', { defaultValue: 'Loading…' })}</div>}>
      <ChannelModalContentLazy />
    </Suspense>
  );

  if (loading) {
    return <div className='p-24px text-t-secondary'>{t('common.loading', { defaultValue: 'Loading…' })}</div>;
  }

  return (
    <div className='flex flex-col h-full w-full'>
      {!isPageMode ? (
        <Tabs activeTab={activeTab} onChange={(key) => setActiveTab(key as 'access' | 'channels')}>
          <Tabs.TabPane key='access' title={t('settings.webui', { defaultValue: 'WebUI' })}>
            <AionScrollArea className='h-full px-24px pb-16px'>{accessContent}</AionScrollArea>
          </Tabs.TabPane>
          <Tabs.TabPane key='channels' title={t('settings.webui.featureChannelsTitle', { defaultValue: 'Channels' })}>
            <AionScrollArea className='h-full px-24px pb-16px'>{channelsContent}</AionScrollArea>
          </Tabs.TabPane>
        </Tabs>
      ) : (
        <div className='flex flex-col gap-32px'>
          {accessContent}
          {channelsContent}
        </div>
      )}

      <PasswordModal
        visible={passwordModalVisible}
        loading={passwordLoading}
        onCancel={() => setPasswordModalVisible(false)}
        onSubmit={handlePasswordSubmit}
      />
      <UsernameModal
        visible={usernameModalVisible}
        loading={usernameLoading}
        currentUsername={status?.adminUsername || 'admin'}
        onCancel={() => setUsernameModalVisible(false)}
        onSubmit={handleUsernameSubmit}
      />
    </div>
  );
};

export default WebuiModalContent;
