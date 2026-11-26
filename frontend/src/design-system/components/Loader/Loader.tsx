import logo from '../../../assets/mentorq-logo.svg?inline';

export function Loader({ label = 'Loading' }: { label?: string }) {
  const sliceCount = 9;
  return (
    <div className="mqds-loader" role="status">
      <div className="mqds-loader-mark" aria-hidden="true">
        {Array.from({ length: sliceCount }, (_, index) => (
          <img key={index} src={logo} alt="" width="96" height="63" style={{
            clipPath: 'inset(0 calc(' + ((sliceCount - 1 - index) / sliceCount * 100) + '% + 2.25px) 0 calc(' + (index / sliceCount * 100) + '% + 2.25px))',
            animationDelay: (index * .18 - 2) + 's',
          }} />
        ))}
      </div>
      {label}
    </div>
  );
}
