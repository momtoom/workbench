import { useState } from 'react';
import { FileText } from 'lucide-react';
import workbenchThirdPartyNotices from '../../../../THIRD_PARTY_NOTICES.md?raw';
import workbenchNodeModuleNotices from '../../../../THIRD_PARTY_NODE_MODULE_NOTICES.md?raw';
import workbenchRuntimeNotices from '../../../../THIRD_PARTY_RUNTIME_NOTICES.md?raw';
import { ModalLayer } from './ModalLayer';

type LicenseGroup = {
  content: string;
  description: string;
  id: string;
  label: string;
};

const licenseGroups: LicenseGroup[] = [
  {
    content: extractNoticeSection(workbenchThirdPartyNotices, 'MIT-licensed design systems and icon libraries'),
    description: 'shadcn, Astryx, Base UI, Tabler',
    id: 'mit-systems',
    label: 'UI systems',
  },
  {
    content: extractNoticeSection(workbenchThirdPartyNotices, 'Lucide Icons'),
    description: 'ISC and MIT',
    id: 'lucide',
    label: 'Lucide Icons',
  },
  {
    content: extractNoticeSection(workbenchThirdPartyNotices, 'Remix Icon'),
    description: 'Remix Icon License v1.0',
    id: 'remix-icon',
    label: 'Remix Icon',
  },
  {
    content: extractNoticeSection(workbenchThirdPartyNotices, 'Public Sans'),
    description: 'SIL Open Font License 1.1',
    id: 'public-sans',
    label: 'Public Sans',
  },
  {
    content: workbenchNodeModuleNotices.trim(),
    description: 'Production package notices',
    id: 'node-modules',
    label: 'Node modules',
  },
  {
    content: workbenchRuntimeNotices.trim(),
    description: 'Fonts, icons, and other remote assets',
    id: 'runtime-assets',
    label: 'Runtime & assets',
  },
];

export function OpenSourceLicensesModal({ onClose }: { onClose: () => void }) {
  const [selectedGroupId, setSelectedGroupId] = useState(licenseGroups[0].id);
  const selectedGroup = licenseGroups.find((group) => group.id === selectedGroupId) ?? licenseGroups[0];

  return (
    <ModalLayer className="wb-open-source-licenses-modal" title="Open-source licenses" onClose={onClose}>
      <div className="wb-license-groups">
        <nav className="wb-license-group-menu" aria-label="License groups">
          {licenseGroups.map((group) => {
            const selected = group.id === selectedGroup.id;
            return (
              <button
                key={group.id}
                type="button"
                className={selected ? 'wb-license-group-button wb-license-group-button--selected' : 'wb-license-group-button'}
                aria-current={selected ? 'page' : undefined}
                onClick={() => setSelectedGroupId(group.id)}
              >
                <FileText size={14} aria-hidden="true" />
                <span>
                  <strong>{group.label}</strong>
                  <small>{group.description}</small>
                </span>
              </button>
            );
          })}
        </nav>

        <section className="wb-license-group-content" aria-label={`${selectedGroup.label} license notice`}>
          <header>
            <h2>{selectedGroup.label}</h2>
            <p>{selectedGroup.description}</p>
          </header>
          <pre>{selectedGroup.content}</pre>
        </section>
      </div>
    </ModalLayer>
  );
}

function extractNoticeSection(notices: string, heading: string): string {
  const sectionStart = notices.indexOf(`## ${heading}`);
  if (sectionStart === -1) return notices.trim();
  const sectionEnd = notices.indexOf('\n## ', sectionStart + 4);
  return notices.slice(sectionStart, sectionEnd === -1 ? undefined : sectionEnd).trim();
}
