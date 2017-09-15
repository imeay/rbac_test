const koa = require('koa');
const router = require('koa-router')();
const AccessControl = require('accesscontrol');
const app = new koa();

// should read from table and make construct like this
const grantsObject = {
  admin: {
    blogs: {
      'create:any': ['*'],
      'read:any': ['*'],
      'update:any': ['*'],
      'delete:any': ['*'],
    },
  },
  user: {
    blogs: {
      'create:own': ['*'],
      'read:own': ['*'],
      'update:own': ['*'],
      'delete:own': ['*'],
    },
  },
};

const ac = new AccessControl(grantsObject);

function resource_check(resource) {
  let method = '';
  return async (ctx, next) => {
    let possession = '';
    let action = '';
    let { user, method } = ctx.request;

    const {
            role,
      sources,
        } = user;

    switch (method.toLowerCase()) {
      case 'get':
        action = 'read';
        break;
      case 'put':
        action = 'update';
        break;
      case 'patch':
        action = 'update';
        break;
      case 'delete':
        action = 'delete';
        break;
      case 'post':
        action = 'create';
        break;
    }

    switch (role) {
      case 'admin':
        possession = 'any';
        break;
      case 'user':
        possession = 'own';
        break;
      default:
        possession = 'own';
    }

    if (sources[resource] == null) {
      throw new Error('not valid resource');
    }

    let actions = sources[resource];

    if (actions.indexOf(action) < 0) {
      throw new Error('not valid action');
    }

    var permission = ac.permission({
      role,
      resource,
      action,
      possession,
    });

    if (permission.granted) {
      await next();
    } else {
      throw new Error('not valid resource');
    }
  }
}

app.use(async function (ctx, next) {
  // user info should read from session or database
  ctx.request.user = {
    role: 'admin',
    sources: {
      blogs: ['read', 'delete', 'create', 'update'],
    }
  };
  await next();
})

router.get('/blogs', resource_check('blogs'), (ctx) => {
  ctx.body = {
    name: 'imeay',
  };
});



app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log('listen 3000');
});

