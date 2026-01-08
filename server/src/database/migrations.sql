-- Usuários
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Disciplinas
CREATE TABLE IF NOT EXISTS disciplinas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  peso INTEGER NOT NULL
);

-- Questões
CREATE TABLE IF NOT EXISTS questoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  disciplina_id INTEGER,
  enunciado TEXT NOT NULL,
  alternativa_correta TEXT NOT NULL,
  FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id)
);

-- Resultados das questões
CREATE TABLE IF NOT EXISTS resultados_questoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  questao_id INTEGER,
  acertou INTEGER,
  tempo INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (questao_id) REFERENCES questoes(id)
);

-- Revisões espaçadas
CREATE TABLE IF NOT EXISTS revisoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  disciplina_id INTEGER,
  data_prevista DATE,
  status TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id)
);
-- Planos de estudo
CREATE TABLE IF NOT EXISTS planos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  dia_semana TEXT NOT NULL,
  disciplina TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS revisoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  disciplina TEXT NOT NULL,
  data_prevista DATE NOT NULL,
  status TEXT DEFAULT 'pendente'
);
CREATE TABLE IF NOT EXISTS disciplinas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE,
  peso INTEGER DEFAULT 1
);
