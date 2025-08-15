import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";

export const meta = () => ([
    { title: 'ResumeIQ | Review ' },
    { name: 'description', content: 'Detailed overview of your resume' },
]);

// Make Feedback type match real-world data (allowing undefined)
interface Feedback {
    overallScore?: number;
    toneAndStyle?: { score?: number; tips?: string[] };
    content?: { score?: number; tips?: string[] };
    structure?: { score?: number; tips?: string[] };
    skills?: { score?: number; tips?: string[] };
    ATS?: { score?: number; tips?: string[] };
}

const Resume = () => {
    const { auth, isLoading, fs, kv } = usePuterStore();
    const { id } = useParams();
    const [imageUrl, setImageUrl] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate(`/auth?next=/resume/${id}`);
        }
    }, [isLoading, auth.isAuthenticated, navigate, id]);

    useEffect(() => {
        const loadResume = async () => {
            const resume = await kv.get(`resume:${id}`);
            if (!resume) return;

            const data = JSON.parse(resume);

            // Load resume PDF
            const resumeBlob = await fs.read(data.resumePath);
            if (resumeBlob) {
                const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
                setResumeUrl(URL.createObjectURL(pdfBlob));
            }

            // Load preview image
            const imageBlob = await fs.read(data.imagePath);
            if (imageBlob) {
                setImageUrl(URL.createObjectURL(imageBlob));
            }

            // Set feedback safely
            setFeedback(data.feedback ?? null);

            console.log({
                resumeUrl,
                imageUrl,
                feedback: data.feedback
            });
        };

        loadResume();
    }, [id, fs, kv, resumeUrl, imageUrl]);

    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>

            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
                    <h2 className="text-4xl !text-black font-bold">Resume Review</h2>

                    {feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={feedback} />
                            <ATS
                                score={feedback.ATS?.score ?? 0}
                                suggestions={feedback.ATS?.tips ?? []}
                            />
                            <Details feedback={feedback} />
                        </div>
                    ) : (
                        <img src="/images/resume-scan-2.gif" className="w-full" />
                    )}
                </section>
            </div>
        </main>
    );
};

export default Resume;
