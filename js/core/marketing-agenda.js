/* ============================================
   MilkyPot - Marketing Agenda SDK (MilkyClube)
   ============================================
   Gerencia agenda editorial de posts virais.
   Persistencia: Firestore (cloud) + DataStore (cache local).

   ATENCAO - acao manual necessaria pelo super_admin:
   Adicionar em firestore.rules dentro de match /databases/{database}/documents {
   --------------------------------------------------
   match /marketing_agenda/{postId} {
     allow read: if isAuthenticated();
     allow write: if isAuthenticated();
   }
   --------------------------------------------------
   Ate que a rule seja adicionada, a gravacao cloud ira falhar
   silenciosamente e o SDK mantem apenas o cache local funcional.
   ============================================ */

(function(global){
    'use strict';

    var COLLECTION = 'marketing_agenda';
    var CACHE_KEY = 'marketing_agenda_viral';

    function getDb(){
        try {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                return firebase.firestore();
            }
        } catch(e) { /* noop */ }
        return null;
    }

    function safeLocalGet(){
        try {
            if (typeof DataStore !== 'undefined' && DataStore.get) {
                return DataStore.get(CACHE_KEY) || [];
            }
            var raw = localStorage.getItem('mp_' + CACHE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch(e) { return []; }
    }

    function safeLocalSet(arr){
        try {
            if (typeof DataStore !== 'undefined' && DataStore.set) {
                DataStore.set(CACHE_KEY, arr);
                return true;
            }
            localStorage.setItem('mp_' + CACHE_KEY, JSON.stringify(arr));
            return true;
        } catch(e) { return false; }
    }

    var MarketingAgenda = {

        /**
         * Lista posts da agenda.
         * @param {string=} franchiseId - filtro opcional por franquia (null = todos)
         * @returns {Promise<Array>} posts ordenados por data.
         */
        list: function(franchiseId){
            return new Promise(function(resolve){
                var local = safeLocalGet();
                var db = getDb();
                if (!db) {
                    resolve(sortByDate(filterFranchise(local, franchiseId)));
                    return;
                }
                var ref = db.collection(COLLECTION);
                ref.get().then(function(snap){
                    var cloud = [];
                    snap.forEach(function(d){
                        cloud.push(Object.assign({ id: d.id }, d.data()));
                    });
                    if (cloud.length > 0) {
                        safeLocalSet(cloud);
                        resolve(sortByDate(filterFranchise(cloud, franchiseId)));
                    } else {
                        resolve(sortByDate(filterFranchise(local, franchiseId)));
                    }
                }).catch(function(err){
                    console.warn('MarketingAgenda.list cloud fail, usando cache:', err && err.message);
                    resolve(sortByDate(filterFranchise(local, franchiseId)));
                });
            });
        },

        /**
         * Atualiza status de um post. Escreve na nuvem e sincroniza cache.
         * @param {string} postId
         * @param {string} status - Pendente | Producao | Agendado | Publicado
         */
        updateStatus: function(postId, status){
            var local = safeLocalGet();
            var idx = local.findIndex(function(p){ return p.id === postId; });
            if (idx >= 0) {
                local[idx].status = status;
                local[idx].updatedAt = new Date().toISOString();
                safeLocalSet(local);
            }
            var db = getDb();
            if (!db) return Promise.resolve({ local: true, cloud: false });
            return db.collection(COLLECTION).doc(postId).set({
                status: status,
                updatedAt: new Date().toISOString()
            }, { merge: true }).then(function(){
                return { local: true, cloud: true };
            }).catch(function(err){
                console.warn('MarketingAgenda.updateStatus cloud fail:', err && err.message);
                return { local: true, cloud: false };
            });
        },

        /**
         * Popula a agenda caso esteja vazia. Nao duplica.
         * @param {Array} viralPlanArray
         */
        seed: function(viralPlanArray){
            if (!Array.isArray(viralPlanArray) || viralPlanArray.length === 0) return Promise.resolve(false);
            var self = this;
            return self.list().then(function(existing){
                if (existing && existing.length > 0) return false;
                safeLocalSet(viralPlanArray);
                var db = getDb();
                if (!db) return false;
                var batch = db.batch();
                viralPlanArray.forEach(function(p){
                    var ref = db.collection(COLLECTION).doc(p.id);
                    batch.set(ref, p, { merge: true });
                });
                return batch.commit().then(function(){ return true; }).catch(function(err){
                    console.warn('MarketingAgenda.seed cloud fail:', err && err.message);
                    return false;
                });
            });
        },

        /**
         * Re-seed forcado (administrativo) - preserva status ja definido.
         */
        reseed: function(viralPlanArray){
            var existing = safeLocalGet();
            var byId = {};
            existing.forEach(function(p){ byId[p.id] = p; });
            var merged = viralPlanArray.map(function(p){
                if (byId[p.id] && byId[p.id].status) p.status = byId[p.id].status;
                return p;
            });
            safeLocalSet(merged);
            var db = getDb();
            if (!db) return Promise.resolve(false);
            var batch = db.batch();
            merged.forEach(function(p){
                var ref = db.collection(COLLECTION).doc(p.id);
                batch.set(ref, p, { merge: true });
            });
            return batch.commit().then(function(){ return true; }).catch(function(err){
                console.warn('MarketingAgenda.reseed cloud fail:', err && err.message);
                return false;
            });
        },

        /**
         * Exporta a agenda em CSV.
         * @param {Array} posts
         * @returns {string} csv
         */
        toCsv: function(posts){
            var headers = ['id','date','platform','phase','hook','status','caption','hashtags','cta','audio'];
            var lines = [headers.join(',')];
            posts.forEach(function(p){
                lines.push(headers.map(function(h){
                    var v = p[h] == null ? '' : String(p[h]);
                    v = v.replace(/"/g,'""');
                    if (v.indexOf(',') >= 0 || v.indexOf('\n') >= 0 || v.indexOf('"') >= 0) v = '"' + v + '"';
                    return v;
                }).join(','));
            });
            return lines.join('\n');
        }
    };

    function filterFranchise(arr, franchiseId){
        if (!franchiseId) return arr.slice();
        return arr.filter(function(p){
            return !p.franchiseId || p.franchiseId === franchiseId;
        });
    }

    function sortByDate(arr){
        return arr.slice().sort(function(a,b){
            return String(a.date).localeCompare(String(b.date));
        });
    }

    global.MarketingAgenda = MarketingAgenda;

})(typeof window !== 'undefined' ? window : this);
