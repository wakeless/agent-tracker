import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  const videoUrl = useBaseUrl('/video/demo.mp4');
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          I kept losing my Claude windows
        </Heading>
        <p className="hero__subtitle">
          So I built a dashboard to track them all
        </p>
        <div style={{marginTop: '2rem', maxWidth: '1200px', margin: '2rem auto'}}>
          <div style={{marginBottom: '2rem', position: 'relative'}}>
            <video
              controls
              autoPlay
              loop
              muted
              playsInline
              controlsList="nodownload"
              style={{
                width: '100%',
                maxWidth: '1100px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                display: 'block',
                margin: '0 auto'
              }}
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <p style={{fontSize: '1.1rem', lineHeight: '1.6'}}>
            You know that feeling when you've got 5 Claude Code sessions scattered across
            different terminals and tabs? Some running, some suspended with Ctrl+Z, some you
            forgot about entirely? Yeah, me too.
          </p>
          <p style={{fontSize: '1.1rem', lineHeight: '1.6', marginTop: '1rem'}}>
            <strong>Agent Tracker</strong> is my solution: a real-time TUI dashboard that shows
            all your Claude sessions in one place. No more lost work, no more "which terminal
            was that in?"
          </p>
        </div>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Get Started
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="https://github.com/wakeless/agent-tracker"
            style={{marginLeft: '1rem'}}>
            View on GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Agent Tracker - Never lose track of your Claude Code sessions"
      description="A real-time TUI dashboard for tracking Claude Code sessions. See all your active AI agent sessions, their context, and activity in one clean interface. Never lose a session again.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
