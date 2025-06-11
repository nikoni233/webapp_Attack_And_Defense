CREATE TABLE IF NOT EXISTS users (
    student_id VARCHAR(20) PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(50),
    age INT,
    email VARCHAR(100)
);

INSERT IGNORE INTO users (student_id, username, password, name, age, email)
VALUES ('2023001', 'alice', 'al123456', 'Alice Wang', 20, 'alice@example.com'),
       ('2023002', 'zs', '123456', 'San Zhang', 25, 'zhangsa@example.com'),
       ('2023003', 'lisi', '123456', 'Si Li', 18, 'lisi@example.com'),
       ('2023004', 'bob', 'bo123456', 'Bob Wang', 22, 'bob@example.com');