import React from "react";
import { Edit3, ArrowRight, MessageCircle, Lightbulb, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

const features = [
  {
    icon: <MessageCircle className="w-6 h-6 text-white" />,
    title: "Comments",
    desc: "Discuss and resolve with instant feedback.",
    bg: "bg-primary-700 dark:bg-primary-800",
  },
  {
    icon: <Lightbulb className="w-6 h-6 text-white" />,
    title: "Suggestions",
    desc: "Propose edits; accept or reject as a team.",
    bg: "bg-blue-600 dark:bg-blue-700",
  },
  {
    icon: <Users className="w-6 h-6 text-white" />,
    title: "Live Collaboration",
    desc: "See who’s online. Sync doc edits in real-time.",
    bg: "bg-secondary-700 dark:bg-secondary-800",
  },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-secondary-900 dark:to-secondary-950 transition-colors duration-500">
      {/* Header */}
      <header className="w-full border-b border-primary-200 dark:border-secondary-700 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-500">
        <div className="max-w-2xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-2">
            <Edit3 className="h-7 w-7 text-primary-700 dark:text-primary-300 cursor:pointer" />
            <span className="text-2xl font-bold tracking-tight text-primary-900 dark:text-white cursor:pointer">Doc Space</span>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <button
              onClick={() => navigate("/login")}
              className="bg-white dark:bg-secondary-900 border border-primary-700 dark:border-primary-200 text-primary-800 dark:text-primary-200 px-4 py-1.5 rounded-full hover:bg-primary-50 dark:hover:bg-secondary-800 transition font-medium"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-primary-800 dark:bg-primary-700 text-white px-5 py-2 rounded-full hover:bg-primary-700 dark:hover:bg-primary-600 transition-all font-medium"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-16">
        <div className="max-w-xl mx-auto text-center space-y-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary-900 dark:text-white leading-tight">
            Minimal docs. <br /> <span className="text-primary-700 dark:text-primary-400">Maximum collaboration.</span>
          </h1>
          <p className="text-lg text-primary-700/80 dark:text-primary-200">
            Simple, beautiful docs—<b>live</b> with your team. Add comments, suggest edits, or just focus and write.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-2 bg-primary-700 dark:bg-primary-600 text-white px-6 py-3 rounded-full hover:bg-primary-800 dark:hover:bg-primary-700 transition-all font-semibold text-lg shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 bg-white border border-primary-700 dark:bg-secondary-900 dark:border-primary-200 text-primary-800 dark:text-primary-200 px-6 py-3 rounded-full hover:bg-primary-50 dark:hover:bg-secondary-800 transition-all font-semibold text-lg"
            >
              Login
            </button>
          </div>
        </div>
        {/* App mock */}
        <div className="mt-14 flex justify-center items-center">
          <div className="rounded-[2rem] overflow-hidden shadow-2xl border border-primary-200 dark:border-secondary-600 bg-white dark:bg-secondary-800 w-[351px] h-[210px] flex flex-col p-6 relative transition-colors">
            <div className="flex space-x-2">
              <span className="block w-2.5 h-2.5 bg-primary-300 dark:bg-primary-400 rounded-full"></span>
              <span className="block w-2.5 h-2.5 bg-primary-400 dark:bg-primary-500 rounded-full"></span>
              <span className="block w-2.5 h-2.5 bg-primary-500 dark:bg-primary-600 rounded-full"></span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-primary-900 dark:text-white">Your doc, live.</div>
              <div className="flex items-center gap-2 mt-3">
                <MessageCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <Lightbulb className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <Users className="w-4 h-4 text-secondary-700 dark:text-secondary-400" />
              </div>
              <div className="text-xs text-primary-400 dark:text-primary-200 mt-3">
                Real-time collaboration | Comments | Suggestions
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="max-w-2xl mx-auto w-full px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {features.map((f) => (
          <div
            key={f.title}
            className={`rounded-xl border border-primary-200 dark:border-secondary-600 flex flex-col items-center text-center p-5 space-y-3 bg-white dark:bg-secondary-800 hover:shadow-md transition`}
          >
            <span className={`rounded-lg p-2 ${f.bg}`}>{f.icon}</span>
            <div className="font-semibold text-primary-900 dark:text-white">{f.title}</div>
            <div className="text-sm text-primary-500 dark:text-primary-200">{f.desc}</div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Home;
