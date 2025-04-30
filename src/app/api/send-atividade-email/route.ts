// /api/send-atividade-email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY); // Aqui a chave será lida corretamente

export async function POST(req: Request) {
  const { to, titulo, descricao, atividadeId } = await req.json();

  try {
    const result = await resend.emails.send({
      from: 'LFC Revisão <noreply@estoquelfc.com>',
      to,
      subject: '📌 Nova Atividade Atribuída!',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>📌 Nova Atividade Atribuída</h2>
          <p><strong>Título:</strong> ${titulo}</p>
          <p><strong>Descrição:</strong> ${descricao}</p>
          <br />
          <a href="https://lfc-revisao.vercel.app/feed" target="_blank" 
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
