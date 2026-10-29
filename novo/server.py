import os, time, smtplib
from email.message import EmailMessage
from flask import Flask, request, jsonify

# Carrega o arquivo .env (se existir) para as variáveis de ambiente.
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "465"))      # 465 = SSL | 587 = STARTTLS
SMTP_USER = os.environ.get("SMTP_USER", "emilymara843@gmail.com").strip()      # e-mail que ENVIA
SMTP_PASS = os.environ.get("SMTP_PASS", "qsnhwlghsmozcyaa").replace(" ", "")  # senha de app (sem espaços)
# e-mail que RECEBE os pedidos (se EMAIL_DESTINO não estiver definido, usa este)
EMAIL_DESTINO = os.environ.get("EMAIL_DESTINO", "mimilyfelina@gmail.com").strip()
# Só necessário se o site ficar em OUTRO domínio (ex.: "https://zarts.com.br"). Vários: separe por vírgula.
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]

app = Flask(__name__, static_folder="public", static_url_path="")

if os.environ.get("TRUST_PROXY") == "1":                 # Render/Railway/Nginx: IP real do cliente
    from werkzeug.middleware.proxy_fix import ProxyFix
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1)

if not (SMTP_USER and SMTP_PASS):
    app.logger.warning("SMTP_USER/SMTP_PASS não definidos: o envio de e-mail vai falhar (503).")

acessos = {}  # limite simples por IP (em memória)


def limpa_acessos(agora):
    if len(acessos) > 1000:
        for ip in [i for i, ts in acessos.items() if not ts or agora - ts[-1] > 60]:
            del acessos[ip]


@app.after_request
def cors(resp):
    origem = request.headers.get("Origin")
    if origem and origem in CORS_ORIGINS:
        resp.headers["Access-Control-Allow-Origin"] = origem
        resp.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
        resp.headers["Vary"] = "Origin"
    return resp


@app.get("/")
def index():
    return app.send_static_file("index.html")


@app.get("/health")
def health():
    return jsonify(ok=True)


@app.route("/api/pedido", methods=["POST", "OPTIONS"])
def pedido():
    if request.method == "OPTIONS":
        return "", 204

    ip = request.remote_addr or "?"
    agora = time.time()
    recentes = [t for t in acessos.get(ip, []) if agora - t < 60]
    if len(recentes) >= 5:
        return jsonify(ok=False, erro="muitas tentativas"), 429
    acessos[ip] = recentes + [agora]
    limpa_acessos(agora)

    dados = request.get_json(silent=True) or {}
    if dados.get("site"):                       # honeypot anti-robô
        return jsonify(ok=True)
    mensagem = str(dados.get("mensagem", "")).strip()[:8000]
    nome = " ".join(str(dados.get("nome", "")).split())[:80] or "Cliente"  # sem quebras de linha no assunto
    if len(mensagem) < 20:
        return jsonify(ok=False, erro="mensagem vazia"), 400
    if not (SMTP_USER and SMTP_PASS and EMAIL_DESTINO):
        app.logger.error("E-mail não configurado (SMTP_USER / SMTP_PASS / EMAIL_DESTINO).")
        return jsonify(ok=False, erro="e-mail não configurado"), 503

    msg = EmailMessage()
    msg["Subject"] = f"Novo pedido de orçamento — {nome}"
    msg["From"] = SMTP_USER
    msg["To"] = EMAIL_DESTINO
    msg.set_content(mensagem.replace("*", ""))   # tira os asteriscos do WhatsApp

    try:
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as s:
                s.login(SMTP_USER, SMTP_PASS)
                s.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as s:
                s.starttls()
                s.login(SMTP_USER, SMTP_PASS)
                s.send_message(msg)
    except Exception as e:
        app.logger.error("Falha no e-mail: %s", e)
        return jsonify(ok=False, erro="falha no envio"), 500
    return jsonify(ok=True)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")))
