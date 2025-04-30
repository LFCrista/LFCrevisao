// /api/send-concAtividade-email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY); // Certifique-se de configurar a chave corretamente no .env

export async function POST(req: Request) {
  const { titulo_atividade, obs_envio, atividadeId, nome_usuario } = await req.json(); // Incluindo o nome do usuário

  // E-mail fixo (padrão)
  const to = "joao.koguishi@gmail.com"; // Substitua pelo e-mail fixo desejado

  try {
    const result = await resend.emails.send({
      from: 'LFC Revisão <noreply@estoquelfc.com>', // De onde o e-mail será enviado
      to, // Destinatário fixo
      subject: `${nome_usuario} concluiu a atividade ${titulo_atividade}!`, // Assunto do e-mail
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>${nome_usuario} concluiu a atividade ${titulo_atividade}!</h2>
          <p><strong>Observação de Envio:</strong> ${obs_envio}</p>
          <br />
          <a href="https://lfc-revisao.vercel.app/admin/atividades/${atividadeId}" target="_blank" 
             style="display: inline-block; padding: 10px 20px; background-color: #00a830; color: white; text-decoration: none; border-radius: 5px;">
            Ver Atividade
          </a>
        </div>
      `,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}