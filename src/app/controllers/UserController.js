import User from '../models/User';

import {
  validateUserData,
  validateUserUpdate,
} from '../helpers/dataValidation';

class UserController {
  async store(req, res) {
    try {
      await validateUserData(req.body);

      const { is_admin } = req.body;
      if (is_admin) {
        throw new Error('Requisição inválida.');
      }
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const user = await User.findOne({ where: { email: req.body.email } });

      if (user) {
        return res.status(400).json({ error: 'O usuário já existe.' });
      }

      const {
        id,
        name,
        email,
        description,
        birthday,
        course,
      } = await User.create(req.body);

      return res.json({
        id,
        name,
        email,
        description,
        birthday,
        course,
      });
    } catch (err) {
      if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res
          .status(400)
          .json({ error: 'O avatar informado não existe.' });
      }
      return res.status(500).json({ error: 'Erro ao criar usuário.' });
    }
  }

  async update(req, res) {
    const { userId } = req;
    try {
      await validateUserUpdate(req.body);

      const { is_admin } = req.body;
      if (is_admin) {
        throw new Error('Requisição inválida.');
      }
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const { email, oldPassword } = req.body;

    try {
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(400).json({ error: 'Usuário não encontrado.' });
      }

      if (email && email !== user.email) {
        const newEmailInvalid = await User.findOne({
          where: { email },
        });

        if (newEmailInvalid) {
          return res.status(400).json({ error: 'E-mail já cadastrado.' });
        }
      }

      if (oldPassword && !(await user.validatePassword(oldPassword))) {
        return res.status(401).json({ error: 'Senha incorreta.' });
      }

      const {
        id,
        name,
        description,
        birthday,
        course,
        email: newEmail,
      } = await user.update(req.body);

      return res.json({
        id,
        name,
        email: newEmail,
        description,
        birthday,
        course,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
  }

  async delete(req, res) {
    const user = await User.findByPk(req.userId);
    if (!user.is_admin) {
      return res.status(403).json({ error: 'Ação não autorizada ' });
    }

    const { id } = req.params;
    if (!Number.isInteger(Number.parseInt(id, 10))) {
      return res.status(400).json({ error: 'Requisição inválida.' });
    }

    try {
      const userToBeDeleted = await User.findByPk(id);
      if (!userToBeDeleted) {
        return res.status(400).json({ error: 'Usuário não encontrado.' });
      }

      await userToBeDeleted.destroy();

      return res.json({ id });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao deletar o usuário.' });
    }
  }
}

export default new UserController();
