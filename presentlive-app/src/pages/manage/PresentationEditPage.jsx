import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { presentations as presentationsApi } from '../../lib/api/index.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { useMutation } from '../../hooks/useMutation.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useToast } from '../../context/toastContext.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { DataState } from '../../components/ui/States.jsx';
import { PresentationForm } from '../../components/presentations/PresentationForm.jsx';

/**
 * Edit the details of an existing deck.
 *
 * This route is also the collaborator "edit link": it carries the presentation
 * id in the URL and loads entirely from that id, so it opens in any browser
 * without a sign-in.
 */
export const PresentationEditPage = () => {
  const { presentationId } = useParams();
  const navigate = useNavigate();
  const { notifySuccess } = useToast();

  const { data, status, error, reload } = useAsyncData(
    ({ signal }) => presentationsApi.get(presentationId, { signal }),
    [presentationId],
  );

  useDocumentTitle(data ? `Edit ${data.title}` : 'Edit presentation');

  const update = useMutation(
    useCallback((values) => presentationsApi.update(presentationId, values), [presentationId]),
  );

  /**
   * Save the changes and return to the deck workspace.
   *
   * @param {object} values
   */
  const handleSubmit = async (values) => {
    const result = await update.run(values);
    if (!result.ok) return;

    notifySuccess('Presentation details saved.');
    navigate(`/presentations/${presentationId}`);
  };

  return (
    <div className="page page--narrow">
      <PageHeader
        backTo={`/presentations/${presentationId}`}
        backLabel="Back to deck"
        eyebrow="Presentation details"
        title={data ? `Edit "${data.title}"` : 'Edit presentation'}
        description="Change the title, description, presenter or publishing status."
      />

      <DataState
        status={status}
        data={data}
        error={error}
        onRetry={reload}
        loadingLabel="Loading the presentation"
        errorTitle="This presentation could not be loaded"
      >
        {(presentation) => (
          <Card>
            <PresentationForm
              presentation={presentation}
              onSubmit={handleSubmit}
              submitLabel="Save changes"
              cancelTo={`/presentations/${presentationId}`}
              error={update.error}
            />
          </Card>
        )}
      </DataState>
    </div>
  );
};
