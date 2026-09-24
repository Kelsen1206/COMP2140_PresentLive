import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { presentations as presentationsApi, slides as slidesApi } from '../../lib/api/index.js';
import { toSlideRecord } from '../../lib/slideRecord.js';
import { nextSlidePosition } from '../../lib/statistics.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { useMutation } from '../../hooks/useMutation.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useToast } from '../../context/toastContext.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { DataState } from '../../components/ui/States.jsx';
import { SlideForm } from '../../components/slides/SlideForm.jsx';

/**
 * Add a slide to a deck.
 */
export const SlideNewPage = () => {
  const { presentationId } = useParams();
  const navigate = useNavigate();
  const { notifySuccess } = useToast();

  const { data, status, error, reload } = useAsyncData(
    async ({ signal }) => {
      const [presentation, slideList] = await Promise.all([
        presentationsApi.get(presentationId, { signal }),
        slidesApi.list({ presentation_id: presentationId, sort: 'position' }, { signal }),
      ]);
      return { presentation, slides: slideList };
    },
    [presentationId],
  );

  useDocumentTitle(data ? `Add slide to ${data.presentation.title}` : 'Add slide');

  const creation = useMutation(
    useCallback((values) => slidesApi.create(toSlideRecord(values, presentationId)), [presentationId]),
  );

  /**
   * Save the slide and return to the deck.
   *
   * @param {object} values
   */
  const handleSubmit = async (values) => {
    const result = await creation.run(values);
    if (!result.ok) return;

    notifySuccess(`Slide "${result.data.title}" was added to the deck.`);
    navigate(`/presentations/${presentationId}`);
  };

  return (
    <div className="page">
      <PageHeader
        backTo={`/presentations/${presentationId}`}
        backLabel="Back to deck"
        eyebrow="Step 2 of 3"
        title="Add a slide"
        description="Write the slide in presentMD, or make it a poll to ask your audience a question."
      />

      <DataState
        status={status}
        data={data}
        error={error}
        onRetry={reload}
        loadingLabel="Loading the deck"
        errorTitle="This deck could not be loaded"
      >
        {({ slides }) => (
          <SlideForm
            nextPosition={nextSlidePosition(slides)}
            onSubmit={handleSubmit}
            submitLabel="Add slide"
            cancelTo={`/presentations/${presentationId}`}
            error={creation.error}
          />
        )}
      </DataState>
    </div>
  );
};
