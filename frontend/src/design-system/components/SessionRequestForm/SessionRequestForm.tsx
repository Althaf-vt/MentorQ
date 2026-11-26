import type { FormEventHandler } from 'react';
import { Button } from '../Button/Button';
import { Select } from '../Select/Select';

export type MentorOption = { value: string; label: string };
export type SessionRequestFormProps = {
  titleId?: string;
  showHeading?: boolean;
  mentors: readonly MentorOption[];
  mentor: string;
  onMentorChange: (mentor: string) => void;
  durations?: readonly number[];
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitted?: boolean;
  successLabel?: string;
};

export function SessionRequestForm({ titleId, showHeading = true, mentors, mentor, onMentorChange, durations = [10, 15, 20, 30],
  onSubmit, submitted = false, successLabel = 'Request sent' }: SessionRequestFormProps) {
  return (
    <form className="mqds-session-request-form" onSubmit={onSubmit}>
      {showHeading && (
        <>
          <span className="spring-symbol" aria-hidden="true">{'\u2192'}</span>
          <h2 id={titleId}>Request a session</h2>
        </>
      )}
      <label>Topic
        <input name="topic" required maxLength={100} autoFocus
          onInput={event => event.currentTarget.setCustomValidity('')}
          placeholder="What are you working on?" />
      </label>
      <label>Mentor
        <select name="mentor" value={mentor} required onChange={event => onMentorChange(event.target.value)}>
          {mentors.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}
        </select>
      </label>
      <Select label="Requested time" name="minutes">
        {durations.map(minutes => <option value={minutes} key={minutes}>{minutes} minutes</option>)}
      </Select>
      <Button className="cta submit-request" type="submit" disabled={submitted}>
        {submitted ? successLabel : 'Send request'}
        <span aria-hidden="true">{submitted ? '\u2713' : '\u2192'}</span>
      </Button>
    </form>
  );
}
