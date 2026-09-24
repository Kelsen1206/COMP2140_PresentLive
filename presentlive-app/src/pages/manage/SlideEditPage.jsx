import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { slides as slidesApi } from '../../lib/api/index.js';
import { toSlideRecord } from '../../lib/slideRecord.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { useMutation } from '../../hooks/useMutation.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useToast } from '../../context/toastContext.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { DataState } from '../../components/ui/States.jsx';
import { SlideForm } from '../../components/slides/SlideForm.jsx';

/**
 * Edit one slide of a deck.
 *
 * The form is the same component used for adding a slide; only the starting
 * values and the button label differ.
 */
export const SlideEditPage = () => {
  const { presentationId, slideId } = useParams();
  const navigate = useNavigate();
  const { notifySuccess } = useToast();

  const { data, status, error, reload } = useAsyncData(
    ({ signal }) => slidesApi.get(slideId, { signal }),
    [slideId],
  );

  useDocumentTitle(data ? `Edit ${data.title}` : 'Edit slide');

  const update = useMutation(
    useCallback(
      (values) => slidesApi.update(slideId, toSlideRecord(values, presentationId)),
      [slideId, presentationId],
    ),
  );

  /**
   * Save the changes and return to the deck.
   *
   * @param {object} values
   */
  const handleSubmit = async (values) => {
    const result = await update.run(values);
    if (!result.ok) return;

    notifySuccess(`Slide "${result.data.title}" was saved.`);
    navigate(`/presentations/${presentationId}`);
  };

  return (
    <div className="page">
      <PageHeader
        backTo={`/presentations/${presentationId}`}
        backLabel="Back to deck"
        eyebrow="Edit slide"
        title={data ? data.title : 'Edit slide'}
        description="Changes appear in the preview as you type and take effect for anyone who has not reached this slide yet."
      />

      <DataState
        status={status}
        data={data}
        error={error}
        onRetry={reload}
        loadingLabel="Loading the slide"
        errorTitle="This slide could not be loaded"
      >
        {(slide) => (
          <SlideForm
            slide={slide}
            onSubmit={handleSubmit}
            submitLabel="Save slide"
            cancelTo={`/presentations/${presentationId}`}
            error={update.error}
          />
        )}
      </DataState>
    </div>
  );
};
