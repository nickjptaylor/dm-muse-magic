/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://kowjiumihltsgebyzgox.supabase.co/storage/v1/object/public/email-assets/tavernrecap_logo.png'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for TavernRecap</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO_URL} alt="TavernRecap" width="48" height="48" style={logo} />
          <Heading style={h1}>Your Login Link</Heading>
        </Section>
        <Text style={text}>
          Click the button below to sign in to TavernRecap. This link will expire
          shortly.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Enter the Tavern
        </Button>
        <Text style={footer}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '480px', margin: '0 auto' }
const header = { textAlign: 'center' as const, marginBottom: '20px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  fontFamily: "'Cinzel', Georgia, serif",
  color: '#C9A84C',
  margin: '0 0 10px',
}
const text = {
  fontSize: '14px',
  color: '#3a3a3a',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const button = {
  backgroundColor: '#C9A84C',
  color: '#100D14',
  fontSize: '14px',
  fontFamily: "'Cinzel', Georgia, serif",
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '14px 24px',
  textDecoration: 'none',
  display: 'block' as const,
  textAlign: 'center' as const,
}
const footer = { fontSize: '12px', color: '#948F82', margin: '30px 0 0' }
