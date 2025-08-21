export function getWelcomeEmailBody(email) {
	return `
		<div style="font-family:Arial,sans-serif;background:#f9f9f9;padding:32px;">
			<div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.07);padding:32px;">
				<h1 style="color:#2c3e50;text-align:center;">Bienvenue sur <span style="color:#4f8cff;">ReadFlow</span> !</h1>
				<p style="font-size:1.1em;color:#333;text-align:center;">Bonjour ${email} et merci de rejoindre la communauté des lecteurs passionnés !</p>
				<hr style="margin:24px 0;">
				<p style="color:#444;">Vous pouvez dès maintenant profiter de toutes les fonctionnalités de la plateforme&nbsp;:</p>
				<ul style="color:#444;font-size:1em;line-height:1.7;">
					<li>📚 Suivi de vos lectures et objectifs</li>
					<li>📝 Prise de notes et surlignage intelligent</li>
					<li>📊 Statistiques personnalisées</li>
					<li>🔒 Données sécurisées et synchronisées</li>
				</ul>
				<p style="margin-top:32px;color:#666;">Besoin d'aide ou d'un conseil lecture ? Notre équipe est à votre écoute !</p>
				<p style="margin-top:24px;text-align:center;">
					<a href="https://readflow.com" style="background:#4f8cff;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Découvrir ReadFlow</a>
				</p>
				<hr style="margin:32px 0;">
				<p style="font-size:0.95em;color:#aaa;text-align:center;">L'équipe ReadFlow<br>Merci de votre confiance !</p>
			</div>
		</div>
	`;
}
