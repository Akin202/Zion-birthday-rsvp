import { describe, expect, test } from 'vitest';
import {
  renderConfirmationEmail,
  type ConfirmationEmailInput,
} from '../supabase/functions/_shared/email';
import { eventConfig } from '../config/event.config';

/**
 * The confirmation email is the guest's only copy of their edit link, and the
 * only thing they can show at the door if something goes wrong. These tests
 * cover the three ways it can quietly fail: escaping, Gmail clipping, and the
 * link going missing.
 */

const base: ConfirmationEmailInput = {
  guestFullName: 'Akinola Adebayo',
  email: 'akin@example.com',
  isAttending: true,
  editToken: '11111111-2222-3333-4444-555555555555',
  totalHeadcount: 5,
  childCount: 2,
  hasPlusOne: true,
  nannyCount: 1,
};

function render(overrides: Partial<ConfirmationEmailInput> = {}) {
  return renderConfirmationEmail({ ...base, ...overrides });
}

describe('attending confirmation', () => {
  test('includes the edit link built from the config site URL', () => {
    const { html } = render();
    expect(html).toContain(
      `${eventConfig.confirmation.siteUrl}/rsvp/edit?token=${base.editToken}`,
    );
  });

  test('states the server-computed headcount, not a client figure', () => {
    const { html } = render({ totalHeadcount: 5 });
    expect(html).toContain('5 people');
  });

  test('describes the party composition in words', () => {
    const { html } = render();
    expect(html).toContain('2 adults, 2 children, 1 nanny');
  });

  test('pluralises a single child and single adult correctly', () => {
    const { html } = render({
      hasPlusOne: false,
      childCount: 1,
      nannyCount: 0,
      totalHeadcount: 2,
    });
    expect(html).toContain('1 adult, 1 child');
    expect(html).toContain('2 people');
  });

  test('omits children and nannies when there are none', () => {
    const { html } = render({ childCount: 0, nannyCount: 0 });
    expect(html).not.toContain('children');
    expect(html).not.toContain('nann');
  });

  test('carries the venue details from config, never hardcoded', () => {
    const { html } = render();
    expect(html).toContain(eventConfig.event.venueName);
    expect(html).toContain(eventConfig.event.dateDisplay);
    expect(html).toContain(eventConfig.event.dressCode);
  });
});

describe('declining confirmation', () => {
  test('uses the declining subject and still offers a way back', () => {
    const { subject, html } = render({ isAttending: false });
    expect(subject).toBe(eventConfig.confirmation.decliningSubject);
    expect(html).toContain(`/rsvp/edit?token=${base.editToken}`);
  });

  test('does not quote a headcount or venue at someone who declined', () => {
    const { html } = render({ isAttending: false });
    expect(html).not.toContain(eventConfig.event.venueAddress);
  });
});

describe('safety and deliverability', () => {
  test('escapes HTML in the guest name rather than emitting markup', () => {
    const { html } = render({ guestFullName: '<script>alert(1)</script> Bello' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('escapes quotes and ampersands in names', () => {
    const { html } = render({ guestFullName: "O'Brien & Sons" });
    expect(html).toContain('&#39;');
    expect(html).not.toMatch(/O'Brien/);
  });

  test('stays far below the ~102KB size at which Gmail clips messages', () => {
    for (const isAttending of [true, false]) {
      const { html } = render({ isAttending });
      const bytes = new TextEncoder().encode(html).length;
      expect(bytes).toBeLessThan(20_000);
    }
  });

  test('uses table layout and inline styles only — Gmail strips style blocks', () => {
    const { html } = render();
    expect(html).not.toMatch(/<style[\s>]/i);
    expect(html).toContain('<table role="presentation"');
    expect(html).toContain('style="');
  });

  test('contains no external stylesheet or script references', () => {
    const { html } = render();
    expect(html).not.toMatch(/<link[\s>]/i);
    expect(html).not.toMatch(/<script[\s>]/i);
  });
});
