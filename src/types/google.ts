export type GoogleCredentialResponse = {
  credential?: string;
};

export type GoogleButtonOptions = {
  locale: string;
  shape: 'pill';
  size: 'large';
  text: 'signin_with';
  theme: 'outline';
  type: 'standard';
};

export type GoogleAccounts = {
  id: {
    disableAutoSelect: () => void;
    initialize: (options: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
    }) => void;
    renderButton: (
      container: HTMLElement,
      options: GoogleButtonOptions
    ) => void;
  };
};

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}
