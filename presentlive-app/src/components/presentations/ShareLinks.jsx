import { PRESENTATION_STATUS } from '../../config.js';
import { absoluteUrl } from '../../lib/format.js';
import { Callout } from '../ui/Callout.jsx';
import { CopyField } from '../ui/CopyField.jsx';

/**
 * The two unique links a deck is shared through.
 *
 * Both are ordinary routes carrying the presentation id, so either one works
 * when pasted into a browser that has never seen the app before -- no sign-in
 * and nothing held in this tab.
 *
 * @param {{presentation: object}} props
 */
export const ShareLinks = ({ presentation }) => {
  const presentationLink = absoluteUrl(`/present/${presentation.id}`);
  const editLink = absoluteUrl(`/presentations/${presentation.id}/edit`);
  const isDraft = presentation.status === PRESENTATION_STATUS.draft;

  return (
    <div className="share-links">
      {isDraft ? (
        <Callout tone="warning" title="This deck is still a draft">
          Anyone opening the presentation link will be told it is not ready yet. Set the status to
          Published on the edit screen when you want the audience to be able to join.
        </Callout>
      ) : null}

      <CopyField
        label="Presentation link"
        value={presentationLink}
        description="Give this to your audience. It opens the welcome screen, asks for a display name, then walks them through the deck one slide at a time."
        openLabel="Preview"
        successMessage="Presentation link copied. Share it with your audience."
      />

      <CopyField
        label="Edit link"
        value={editLink}
        description="Give this to a collaborator so they can change the deck details with you."
        successMessage="Edit link copied."
      />
    </div>
  );
};
