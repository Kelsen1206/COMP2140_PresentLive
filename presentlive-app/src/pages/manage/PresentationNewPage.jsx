import { useNavigate } from 'react-router-dom';
import { presentations as presentationsApi } from '../../lib/api/index.js';
import { useMutation } from '../../hooks/useMutation.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useToast } from '../../context/toastContext.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { PresentationForm } from '../../components/presentations/PresentationForm.jsx';

/**
 * Step one of the presenter workflow: describe the talk.
 *
 * On success the presenter lands straight on the new deck's workspace, which is
 * where slides are added -- so there is no moment of wondering what to do next.
 */
export const PresentationNewPage = () => {
  useDocumentTitle('New presentation');

  const navigate = useNavigate();
  const { notifySuccess } = useToast();
  const creation = useMutation(presentationsApi.create);

  /**
   * Save the new presentation and move on to adding slides.
   *
   * @param {object} values
   */
  const handleSubmit = async (values) => {
    const result = await creation.run(values);
    if (!result.ok) return;

    notifySuccess(`"${result.data.title}" was created. Add your first slide next.`);
    navigate(`/presentations/${result.data.id}`);
  };

  return (
    <div className="page page--narrow">
      <PageHeader
        backTo="/presentations"
        backLabel="All presentations"
        eyebrow="Step 1 of 3"
        title="Create a presentation"
        description="Start with the details your audience sees on the welcome screen. You will add slides next."
      />

      <Card>
        <PresentationForm
          onSubmit={handleSubmit}
          submitLabel="Create presentation"
          cancelTo="/presentations"
          error={creation.error}
        />
      </Card>
    </div>
  );
};
