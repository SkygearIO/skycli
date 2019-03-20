
import { GlobalConfig } from '../../types/globalConfig';
import { User } from '../../types/user';

export function updateGlobalConfigUser(config: GlobalConfig, user: User): GlobalConfig {
    const newConfig = {...config};
    const currentContextKey = newConfig.currentContext;
    const currentUserKey = newConfig.context[currentContextKey].user;
    newConfig.user = newConfig.user || {};
    newConfig.user[currentUserKey] = user;
    return newConfig;
}
