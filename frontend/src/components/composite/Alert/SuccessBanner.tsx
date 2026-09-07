import React from 'react';
import { Alert, AlertProps } from './Alert';

export type SuccessBannerProps = Omit<AlertProps, 'variant'>;

export const SuccessBanner: React.FC<SuccessBannerProps> = (props) => {
  return <Alert variant="success" {...props} />;
};

SuccessBanner.displayName = 'SuccessBanner';
