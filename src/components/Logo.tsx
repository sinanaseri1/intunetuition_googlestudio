import logo from '../assets/In-Tune-Tuition-Logo.png';

export function Logo({ className = "h-8" }: { className?: string }) {
  return <img src={logo} alt="In Tune Tuition" className={className} />;
}
