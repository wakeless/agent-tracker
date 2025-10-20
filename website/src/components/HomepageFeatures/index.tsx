import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'The Problem',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Claude Code windows get buried in tabs, suspended with Ctrl+Z, or hidden in background terminals.
        I'd start a session, switch tasks, and completely forget where I left it running.
      </>
    ),
  },
  {
    title: 'The Solution',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        A live dashboard showing every Claude session with context: which project, which terminal,
        what it's doing right now. All in a clean TUI you can pull up anytime with one command.
      </>
    ),
  },
  {
    title: 'How It Works',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Uses Claude's plugin hooks to capture sessions as they start/end and track their activity.
        Extracts rich terminal context (iTerm tabs, Docker containers) and streams everything
        to a dashboard in real-time.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
